import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const LINKS = [
  ['/admin', 'Dashboard', true],
  ['/admin/movies', 'Movies'],
  ['/admin/theatres', 'Theatres & screens'],
  ['/admin/shows', 'Shows'],
  ['/admin/bookings', 'Bookings'],
  ['/admin/users', 'Users'],
]

export default function AdminLayout() {
  const { account, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <div className="admin-shell">
      <aside className={`admin-side ${open ? 'open' : ''}`}>
        <Link to="/admin" className="logo">
          i<span>Movies</span>
        </Link>
        <nav>
          {LINKS.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-user">
          <small className="muted">{account.email}</small>
          <Link to="/" className="muted">View site ↗</Link>
          <button
            className="btn btn-ghost btn-sm"
            onClick={async () => {
              await logout()
              navigate('/admin/login')
            }}
          >
            Logout
          </button>
        </div>
      </aside>
      <section className="admin-main">
        <button className="menu-btn admin-menu" onClick={() => setOpen(!open)}>
          ☰ Menu
        </button>
        <Outlet />
      </section>
    </div>
  )
}
