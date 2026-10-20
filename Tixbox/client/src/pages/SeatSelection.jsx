import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { useApi } from '../hooks.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Loader, Notice } from '../components/ui.jsx'
import { fmtDateTime, inr } from '../utils.js'

const MAX_SEATS = 10

export default function SeatSelection() {
  const { id } = useParams()
  const { account } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { data, error, loading, reload } = useApi(`/shows/${id}`)
  const [selected, setSelected] = useState([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading && !data) return <Loader text="Loading seat map..." />
  if (error) return <div className="container page"><Notice>{error}</Notice></div>

  const { show, seatMap, availableSeats, totalSeats } = data
  const priceOf = {}
  seatMap.forEach((r) => r.seats.forEach((s) => (priceOf[s.seatId] = { price: r.price, type: r.type })))
  const total = selected.reduce((sum, s) => sum + (priceOf[s]?.price || 0), 0)

  const toggle = (seat) => {
    if (seat.status === 'booked') return
    setMsg('')
    if (selected.includes(seat.seatId)) return setSelected(selected.filter((s) => s !== seat.seatId))
    if (selected.length >= MAX_SEATS) return setMsg(`You can select at most ${MAX_SEATS} seats.`)
    setSelected([...selected, seat.seatId])
  }

  const proceed = async () => {
    if (!account) return navigate('/login', { state: { from: location.pathname } })
    if (account.role !== 'user') return setMsg('Please log in with a customer account to book tickets.')
    setBusy(true)
    setMsg('')
    try {
      const res = await api.post('/bookings', { showId: id, seats: selected })
      navigate(`/checkout/${res.booking._id}`)
    } catch (err) {
      setMsg(err.message)
      if (err.status === 409) {
        setSelected([])
        reload()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container page">
      <Link to={`/movies/${show.movie._id}`} className="muted">
        ← Back to {show.movie.title}
      </Link>
      <div className="row-between wrap">
        <div>
          <h1>{show.movie.title}</h1>
          <p className="muted">
            {show.theatre.name}, {show.theatre.city} · {show.screenName} · {fmtDateTime(show.startTime)}
          </p>
        </div>
        <span className="pill">
          {availableSeats} of {totalSeats} seats available
        </span>
      </div>

      <div className="seat-layout">
        <div className="seat-area">
          <div className="screen-bar">SCREEN THIS WAY</div>
          {seatMap.map((row) => (
            <div key={row.row} className="seat-block">
              <div className="seat-type-label">
                {row.type} · {inr(row.price)}
              </div>
              <div className="seat-row">
                <span className="row-label">{row.row}</span>
                {row.seats.map((s) => {
                  const on = selected.includes(s.seatId)
                  return (
                    <button
                      key={s.seatId}
                      className={`seat ${s.status === 'booked' ? 'booked' : ''} ${on ? 'selected' : ''}`}
                      disabled={s.status === 'booked'}
                      onClick={() => toggle(s)}
                      title={`${s.seatId} · ${row.type} · ${inr(row.price)}`}
                    >
                      {s.number}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          <div className="legend">
            <span><i className="seat" /> Available</span>
            <span><i className="seat selected" /> Selected</span>
            <span><i className="seat booked" /> Booked</span>
          </div>
        </div>

        <aside className="card summary">
          <h3>Your selection</h3>
          {selected.length === 0 ? (
            <p className="muted">Click on seats to select them (max {MAX_SEATS}).</p>
          ) : (
            <>
              <div className="chips">
                {selected.map((s) => (
                  <span key={s} className="chip">
                    {s}
                  </span>
                ))}
              </div>
              <div className="row-between total">
                <span>{selected.length} ticket(s)</span>
                <b>{inr(total)}</b>
              </div>
            </>
          )}
          <Notice>{msg}</Notice>
          <button className="btn btn-primary btn-block" disabled={!selected.length || busy} onClick={proceed}>
            {busy ? 'Holding seats...' : account ? 'Proceed to payment' : 'Log in to continue'}
          </button>
          <p className="muted small">Seats are held for a few minutes while you pay.</p>
        </aside>
      </div>
    </div>
  )
}
