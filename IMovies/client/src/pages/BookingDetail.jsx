import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { useApi } from '../hooks.js'
import { Loader, Notice, StatusBadge } from '../components/ui.jsx'
import { fmtDateTime, inr } from '../utils.js'

export default function BookingDetail() {
  const { id } = useParams()
  const location = useLocation()
  const { data, error, loading, reload } = useApi(`/bookings/${id}`)
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState('')

  if (loading && !data) return <Loader />
  if (error) return <div className="container page"><Notice>{error}</Notice></div>

  const b = data.booking
  const canCancel = ['pending', 'confirmed'].includes(b.status) && new Date(b.show.startTime) > new Date()

  const cancel = async () => {
    if (!window.confirm('Cancel this booking?')) return
    setMsg('')
    try {
      const res = await api.put(`/bookings/${id}/cancel`)
      setOk(res.message)
      reload()
    } catch (err) {
      setMsg(err.message)
    }
  }

  return (
    <div className="container page narrow">
      {location.state?.justBooked && b.status === 'confirmed' && (
        <Notice type="success">🎉 Payment successful! Your tickets are confirmed. A receipt was sent to your email.</Notice>
      )}
      <Notice type="success">{ok}</Notice>
      <Notice>{msg}</Notice>

      <div className="ticket">
        <div className="ticket-main">
          <div className="row-between">
            <h2>{b.movie.title}</h2>
            <StatusBadge status={b.status} />
          </div>
          <p className="muted">{b.movie.language}</p>
          <dl className="ticket-grid">
            <div>
              <dt>Theatre</dt>
              <dd>
                {b.theatre.name}, {b.theatre.city}
              </dd>
            </div>
            <div>
              <dt>Screen</dt>
              <dd>{b.show.screenName}</dd>
            </div>
            <div>
              <dt>Show time</dt>
              <dd>{fmtDateTime(b.show.startTime)}</dd>
            </div>
            <div>
              <dt>Seats</dt>
              <dd>{b.seats.map((s) => s.seatId).join(', ')}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>{inr(b.totalAmount)}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>
                <StatusBadge status={b.payment?.status || 'unpaid'} /> {b.payment?.method}
              </dd>
            </div>
            {b.payment?.transactionId && (
              <div>
                <dt>Transaction ID</dt>
                <dd>{b.payment.transactionId}</dd>
              </div>
            )}
          </dl>
        </div>
        <div className="ticket-stub">
          <small>BOOKING ID</small>
          <div className="code">{b.bookingCode}</div>
          <small>Show this at the counter</small>
        </div>
      </div>

      <div className="row gap wrap no-print">
        {b.status === 'pending' && (
          <Link to={`/checkout/${b._id}`} className="btn btn-primary">
            Complete payment
          </Link>
        )}
        {b.status === 'confirmed' && (
          <button className="btn btn-ghost" onClick={() => window.print()}>
            🖨 Print ticket
          </button>
        )}
        {canCancel && (
          <button className="btn btn-danger" onClick={cancel}>
            Cancel booking
          </button>
        )}
        <Link to="/my-bookings" className="btn btn-ghost">
          All my bookings
        </Link>
      </div>
      {canCancel && b.status === 'confirmed' && <p className="muted small">Tickets can be cancelled until 2 hours before the show. Refunds are issued to the original payment method.</p>}
    </div>
  )
}
