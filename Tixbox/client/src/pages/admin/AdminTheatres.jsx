import { useState } from 'react'
import { api } from '../../api.js'
import { useApi } from '../../hooks.js'
import { Empty, Loader, Modal, Notice } from '../../components/ui.jsx'
import { SEAT_TYPES } from '../../utils.js'

const DEFAULT_LAYOUT = [
  { row: 'A', seats: 10, type: 'Regular' },
  { row: 'B', seats: 10, type: 'Regular' },
  { row: 'C', seats: 10, type: 'Premium' },
  { row: 'D', seats: 8, type: 'Recliner' },
]

function TheatreForm({ theatre, onClose, onSaved }) {
  const [f, setF] = useState({ name: theatre?.name || '', city: theatre?.city || '', address: theatre?.address || '' })
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    try {
      if (theatre) await api.put(`/theatres/${theatre._id}`, f)
      else await api.post('/theatres', f)
      onSaved()
    } catch (err) {
      setError(err.message)
    }
  }
  return (
    <Modal title={theatre ? 'Edit theatre' : 'Add theatre'} onClose={onClose}>
      <form onSubmit={submit}>
        <Notice>{error}</Notice>
        <label className="field">Name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="field">City<input required value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></label>
        <label className="field">Address<input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></label>
        <button className="btn btn-primary btn-block">Save theatre</button>
      </form>
    </Modal>
  )
}

function ScreenForm({ theatre, screen, onClose, onSaved }) {
  const [name, setName] = useState(screen?.name || '')
  const [rows, setRows] = useState(screen ? screen.layout.map((r) => ({ ...r })) : DEFAULT_LAYOUT)
  const [error, setError] = useState('')

  const setRow = (i, patch) => setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const addRow = () => {
    const last = rows[rows.length - 1]
    const next = last ? String.fromCharCode(last.row.charCodeAt(0) + 1) : 'A'
    setRows([...rows, { row: next, seats: last?.seats || 10, type: last?.type || 'Regular' }])
  }
  const total = rows.reduce((n, r) => n + Number(r.seats || 0), 0)

  const submit = async (e) => {
    e.preventDefault()
    const layout = rows.map((r) => ({ row: r.row.trim().toUpperCase(), seats: Number(r.seats), type: r.type }))
    if (new Set(layout.map((r) => r.row)).size !== layout.length) return setError('Row letters must be unique')
    try {
      if (screen) await api.put(`/theatres/${theatre._id}/screens/${screen._id}`, { name, layout })
      else await api.post(`/theatres/${theatre._id}/screens`, { name, layout })
      onSaved()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Modal title={`${screen ? 'Edit' : 'Add'} screen — ${theatre.name}`} onClose={onClose}>
      <form onSubmit={submit}>
        <Notice>{error}</Notice>
        <label className="field">Screen name<input required placeholder="Screen 1" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <h4>Seat layout ({total} seats)</h4>
        {rows.map((r, i) => (
          <div className="layout-row" key={i}>
            <input aria-label="Row" maxLength="2" required value={r.row} onChange={(e) => setRow(i, { row: e.target.value })} />
            <input aria-label="Seats" type="number" min="1" max="40" required value={r.seats} onChange={(e) => setRow(i, { seats: e.target.value })} />
            <select aria-label="Type" value={r.type} onChange={(e) => setRow(i, { type: e.target.value })}>
              {SEAT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <button type="button" className="icon-btn" disabled={rows.length === 1} onClick={() => setRows(rows.filter((_, idx) => idx !== i))}>✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={addRow}>+ Add row</button>
        <button className="btn btn-primary btn-block">Save screen</button>
      </form>
    </Modal>
  )
}

export default function AdminTheatres() {
  const { data, error, loading, reload } = useApi('/theatres')
  const [theatreForm, setTheatreForm] = useState(null) // 'new' | theatre
  const [screenForm, setScreenForm] = useState(null) // { theatre, screen? }
  const [msg, setMsg] = useState('')

  const run = async (fn) => {
    setMsg('')
    try {
      await fn()
      reload()
    } catch (err) {
      setMsg(err.message)
    }
  }

  return (
    <>
      <div className="row-between">
        <h1>Theatres & screens</h1>
        <button className="btn btn-primary" onClick={() => setTheatreForm('new')}>+ Add theatre</button>
      </div>
      <Notice>{msg || error}</Notice>
      {loading && !data ? <Loader /> : data && data.theatres.length === 0 ? <Empty>No theatres yet.</Empty> : null}
      {data?.theatres.map((t) => (
        <div className="card" key={t._id}>
          <div className="row-between wrap">
            <div>
              <h3>{t.name}</h3>
              <p className="muted">{t.city}{t.address ? ` · ${t.address}` : ''}</p>
            </div>
            <div className="row gap">
              <button className="btn btn-ghost btn-sm" onClick={() => setScreenForm({ theatre: t })}>+ Screen</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setTheatreForm(t)}>Edit</button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => window.confirm(`Remove ${t.name}?`) && run(() => api.del(`/theatres/${t._id}`))}
              >
                Delete
              </button>
            </div>
          </div>
          {t.screens.length === 0 && <p className="muted">No screens yet — add one so shows can be scheduled.</p>}
          {t.screens.map((s) => (
            <div className="row-between line" key={s._id}>
              <span>
                <b>{s.name}</b>{' '}
                <span className="muted">
                  {s.layout.reduce((n, r) => n + r.seats, 0)} seats · {s.layout.map((r) => `${r.row}(${r.seats} ${r.type})`).join(', ')}
                </span>
              </span>
              <span className="row gap">
                <button className="link-btn" onClick={() => setScreenForm({ theatre: t, screen: s })}>Edit</button>
                <button
                  className="link-btn danger"
                  onClick={() => window.confirm(`Delete ${s.name}?`) && run(() => api.del(`/theatres/${t._id}/screens/${s._id}`))}
                >
                  Delete
                </button>
              </span>
            </div>
          ))}
        </div>
      ))}

      {theatreForm && (
        <TheatreForm
          theatre={theatreForm === 'new' ? null : theatreForm}
          onClose={() => setTheatreForm(null)}
          onSaved={() => {
            setTheatreForm(null)
            reload()
          }}
        />
      )}
      {screenForm && (
        <ScreenForm
          theatre={screenForm.theatre}
          screen={screenForm.screen}
          onClose={() => setScreenForm(null)}
          onSaved={() => {
            setScreenForm(null)
            reload()
          }}
        />
      )}
    </>
  )
}
