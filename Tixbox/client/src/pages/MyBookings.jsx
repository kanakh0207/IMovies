import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useApi } from '../hooks.js'
import { Empty, Loader, Notice, StatusBadge } from '../components/ui.jsx'
import { fmtDateTime, inr } from '../utils.js'

const FILTERS = ['all', 'confirmed', 'pending', 'cancelled', 'expired']

export default function MyBookings() {
  const { data, error, loading, reload } = useApi('/bookings/my')
  const [filter, setFilter] = useState('all')
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState('')

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return
    setMsg('')
    setOk('')
    try {
      const res = await api.put(`/bookings/${id}/cancel`)
      setOk(res.message)
      reload()
    } catch (err) {
      setMsg(err.message)
    }
  }

  if (loading && !data) return <Loader />
  if (error) return <div className="container page"><Notice>{error}</Notice></div>

  const list = data.bookings.filter((b) => filter === 'all' || b.status === filter)

  return (
    <div className="container page">
      <h1>My bookings</h1>
      <div className="tabs">
        {FILTERS.map((f) => (
          <button key={f} className={f === filter ? 'tab active' : 'tab'} onClick={() => setFilter(f)}>
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <Notice>{msg}</Notice>
      <Notice type="success">{ok}</Notice>

      {list.length === 0 && <Empty>No bookings here. <Link to="/movies">Browse movies</Link></Empty>}
      {list.map((b) => (
        <div className="card booking-row" key={b._id}>
          <div>
            <div className="row gap">
              <h3>{b.movie?.title}</h3>
              <StatusBadge status={b.status} />
            </div>
            <p className="muted">
              {b.theatre?.name}, {b.theatre?.city} · {b.show?.screenName}
              <br />
              {b.show && fmtDateTime(b.show.startTime)}
            </p>
            <p>
              Seats: <b>{b.seats.map((s) => s.seatId).join(', ')}</b> · {inr(b.totalAmount)}
              <span className="muted"> · ID {b.bookingCode}</span>
            </p>
          </div>
          <div className="col gap">
            <Link className="btn btn-ghost btn-sm" to={`/bookings/${b._id}`}>
              {b.status === 'pending' ? 'Pay now' : 'View ticket'}
            </Link>
            {['pending', 'confirmed'].includes(b.status) && b.show && new Date(b.show.startTime) > new Date() && (
              <button className="btn btn-danger btn-sm" onClick={() => cancel(b._id)}>
                Cancel
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
