import { useState } from 'react'
import { api } from '../../api.js'
import { useApi } from '../../hooks.js'
import { Empty, Loader, Modal, Notice } from '../../components/ui.jsx'
import { fmtDateTime, inr, SEAT_TYPES } from '../../utils.js'

function PriceInputs({ prices, onChange }) {
  return (
    <div className="three-col">
      {SEAT_TYPES.map((t) => (
        <label className="field" key={t}>
          {t} ₹
          <input type="number" min="0" required value={prices[t]} onChange={(e) => onChange({ ...prices, [t]: e.target.value })} />
        </label>
      ))}
    </div>
  )
}

function CreateShow({ movies, theatres, onClose, onSaved }) {
  const [movie, setMovie] = useState(movies[0]?._id || '')
  const [theatreId, setTheatreId] = useState(theatres[0]?._id || '')
  const [screenId, setScreenId] = useState('')
  const [startTime, setStartTime] = useState('')
  const [prices, setPrices] = useState({ Regular: 150, Premium: 250, Recliner: 400 })
  const [error, setError] = useState('')

  const theatre = theatres.find((t) => t._id === theatreId)
  const screens = theatre?.screens || []
  const activeScreen = screens.find((s) => s._id === screenId) ? screenId : screens[0]?._id || ''

  const submit = async (e) => {
    e.preventDefault()
    const p = Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, Number(v)]))
    try {
      await api.post('/shows', {
        movie,
        theatre: theatreId,
        screenId: activeScreen,
        startTime: new Date(startTime).toISOString(),
        prices: p,
      })
      onSaved()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Modal title="Schedule a show" onClose={onClose}>
      <form onSubmit={submit}>
        <Notice>{error}</Notice>
        <label className="field">Movie
          <select required value={movie} onChange={(e) => setMovie(e.target.value)}>
            {movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
          </select>
        </label>
        <label className="field">Theatre
          <select required value={theatreId} onChange={(e) => setTheatreId(e.target.value)}>
            {theatres.map((t) => <option key={t._id} value={t._id}>{t.name} — {t.city}</option>)}
          </select>
        </label>
        <label className="field">Screen
          <select required value={activeScreen} onChange={(e) => setScreenId(e.target.value)}>
            {screens.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </label>
        <label className="field">Start time<input type="datetime-local" required value={startTime} onChange={(e) => setStartTime(e.target.value)} /></label>
        <PriceInputs prices={prices} onChange={setPrices} />
        <button className="btn btn-primary btn-block" disabled={!activeScreen}>Create show</button>
        {!activeScreen && <p className="muted small">This theatre has no screens. Add one under Theatres & screens first.</p>}
      </form>
    </Modal>
  )
}

function EditPrices({ show, onClose, onSaved }) {
  const [prices, setPrices] = useState({ ...show.prices })
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    const p = Object.fromEntries(SEAT_TYPES.map((t) => [t, Number(prices[t])]))
    try {
      await api.put(`/shows/${show._id}`, { prices: p })
      onSaved()
    } catch (err) {
      setError(err.message)
    }
  }
  return (
    <Modal title={`Prices — ${show.movie.title}`} onClose={onClose}>
      <form onSubmit={submit}>
        <Notice>{error}</Notice>
        <PriceInputs prices={prices} onChange={setPrices} />
        <button className="btn btn-primary btn-block">Save prices</button>
      </form>
    </Modal>
  )
}

export default function AdminShows() {
  const shows = useApi('/shows')
  const movies = useApi('/movies?limit=50&sort=title')
  const theatres = useApi('/theatres')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [msg, setMsg] = useState('')

  const remove = async (s) => {
    if (!window.confirm('Delete this show?')) return
    setMsg('')
    try {
      await api.del(`/shows/${s._id}`)
      shows.reload()
    } catch (err) {
      setMsg(err.message)
    }
  }

  const ready = movies.data && theatres.data

  return (
    <>
      <div className="row-between">
        <h1>Shows</h1>
        <button className="btn btn-primary" disabled={!ready} onClick={() => setCreating(true)}>+ Schedule show</button>
      </div>
      <p className="muted">Upcoming shows only. A show can be deleted only while it has no bookings.</p>
      <Notice>{msg || shows.error}</Notice>
      {shows.loading && !shows.data ? <Loader /> : shows.data && shows.data.shows.length === 0 ? <Empty>No upcoming shows.</Empty> : null}
      {shows.data && shows.data.shows.length > 0 && (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr><th>Movie</th><th>Theatre / screen</th><th>Start</th><th>Booked</th><th>Prices</th><th /></tr>
            </thead>
            <tbody>
              {shows.data.shows.map((s) => (
                <tr key={s._id}>
                  <td><b>{s.movie.title}</b></td>
                  <td>{s.theatre.name}, {s.theatre.city}<br /><small className="muted">{s.screenName}</small></td>
                  <td>{fmtDateTime(s.startTime)}</td>
                  <td>{s.bookedCount}</td>
                  <td><small>{SEAT_TYPES.map((t) => `${t[0]}: ${inr(s.prices[t])}`).join(' · ')}</small></td>
                  <td className="actions">
                    <button className="link-btn" onClick={() => setEditing(s)}>Prices</button>
                    <button className="link-btn danger" onClick={() => remove(s)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {creating && ready && (
        <CreateShow
          movies={movies.data.movies}
          theatres={theatres.data.theatres}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false)
            shows.reload()
          }}
        />
      )}
      {editing && (
        <EditPrices
          show={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            shows.reload()
          }}
        />
      )}
    </>
  )
}
