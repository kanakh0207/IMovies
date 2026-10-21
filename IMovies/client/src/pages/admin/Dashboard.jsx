import { useApi } from '../../hooks.js'
import { Loader, Notice } from '../../components/ui.jsx'
import { inr } from '../../utils.js'

function Stat({ label, value }) {
  return (
    <div className="card stat">
      <small className="muted">{label}</small>
      <b>{value}</b>
    </div>
  )
}

export default function Dashboard() {
  const { data, error, loading } = useApi('/admin/dashboard')
  if (loading && !data) return <Loader />
  if (error) return <Notice>{error}</Notice>

  const { stats, topMovies, last7Days } = data
  const maxRev = Math.max(1, ...last7Days.map((d) => d.revenue))
  const by = stats.bookingsByStatus || {}

  return (
    <>
      <h1>Dashboard</h1>
      <div className="stat-grid">
        <Stat label="Total revenue" value={inr(stats.totalRevenue)} />
        <Stat label="Tickets sold" value={stats.ticketsSold} />
        <Stat label="Registered users" value={stats.users} />
        <Stat label="Active movies" value={stats.movies} />
        <Stat label="Theatres" value={stats.theatres} />
        <Stat label="Upcoming shows" value={stats.upcomingShows} />
      </div>

      <div className="two-col">
        <div className="card">
          <h3>Revenue — last 7 days</h3>
          {last7Days.length === 0 ? (
            <p className="muted">No confirmed bookings in the last 7 days.</p>
          ) : (
            <div className="bars">
              {last7Days.map((d) => (
                <div key={d.date} className="bar-col" title={`${d.bookings} booking(s)`}>
                  <small>{inr(d.revenue)}</small>
                  <div className="bar" style={{ height: `${Math.max(6, (d.revenue / maxRev) * 140)}px` }} />
                  <small className="muted">{d.date.slice(5)}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Bookings by status</h3>
          {Object.keys(by).length === 0 ? (
            <p className="muted">No bookings yet.</p>
          ) : (
            Object.entries(by).map(([k, v]) => (
              <div className="row-between line" key={k}>
                <span style={{ textTransform: 'capitalize' }}>{k}</span>
                <b>{v}</b>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <h3>Top movies by revenue</h3>
        {topMovies.length === 0 ? (
          <p className="muted">No sales yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Movie</th>
                  <th>Tickets</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topMovies.map((m) => (
                  <tr key={m.movieId}>
                    <td>{m.title}</td>
                    <td>{m.tickets}</td>
                    <td>{inr(m.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
