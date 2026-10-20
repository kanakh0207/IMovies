import { useState } from 'react'
import { api } from '../../api.js'
import { useApi } from '../../hooks.js'
import { Loader, Notice, Pagination, StatusBadge } from '../../components/ui.jsx'
import { fmtDateTime, inr } from '../../utils.js'

export default function AdminBookings() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const { data, error, loading, reload } = useApi(`/admin/bookings?limit=15&page=${page}${status ? `&status=${status}` : ''}`)
  const [msg, setMsg] = useState('')

  const cancel = async (b) => {
    if (!window.confirm(`Cancel booking ${b.bookingCode}? Paid bookings are refunded.`)) return
    setMsg('')
    try {
      await api.put(`/bookings/${b._id}/cancel`)
      reload()
    } catch (err) {
      setMsg(err.message)
    }
  }

  return (
    <>
      <h1>Bookings</h1>
      <div className="filters">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>
          {['confirmed', 'pending', 'cancelled', 'expired'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <Notice>{msg || error}</Notice>
      {loading && !data ? <Loader /> : data && (
        <>
          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr><th>Booking</th><th>Customer</th><th>Movie / show</th><th>Seats</th><th>Amount</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {data.bookings.map((b) => (
                  <tr key={b._id}>
                    <td><b>{b.bookingCode}</b><br /><small className="muted">{fmtDateTime(b.createdAt)}</small></td>
                    <td>{b.user?.name || '–'}<br /><small className="muted">{b.user?.email}</small></td>
                    <td>
                      {b.movie?.title}
                      <br /><small className="muted">{b.theatre?.name} · {b.show && fmtDateTime(b.show.startTime)}</small>
                    </td>
                    <td>{b.seats.map((s) => s.seatId).join(', ')}</td>
                    <td>{inr(b.totalAmount)}</td>
                    <td><StatusBadge status={b.status} /> <StatusBadge status={b.payment?.status || 'unpaid'} /></td>
                    <td className="actions">
                      {['pending', 'confirmed'].includes(b.status) && <button className="link-btn danger" onClick={() => cancel(b)}>Cancel</button>}
                    </td>
                  </tr>
                ))}
                {data.bookings.length === 0 && <tr><td colSpan="7" className="muted">No bookings found.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </>
  )
}
