import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { account, logout } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const search = (e) => {
    e.preventDefault()
    navigate(`/movies?search=${encodeURIComponent(q.trim())}`)
    setOpen(false)
  }
  const doLogout = async () => {
    await logout()
    setOpen(false)
    navigate('/')
  }
  const close = () => setOpen(false)

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="logo" onClick={close}>
          i<span>Movies</span>
        </Link>
        <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Menu">
          ☰
        </button>
        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <form onSubmit={search} className="nav-search">
            <input placeholder="Search movies..." value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <NavLink to="/movies" onClick={close}>
            Movies
          </NavLink>
          {account?.role === 'user' && (
            <>
              <NavLink to="/my-bookings" onClick={close}>
                My Bookings
              </NavLink>
              <NavLink to="/favourites" onClick={close}>
                Favourites
              </NavLink>
              <NavLink to="/profile" onClick={close}>
                {account.name.split(' ')[0]}
              </NavLink>
            </>
          )}
          {account?.role === 'admin' && (
            <NavLink to="/admin" onClick={close}>
              Admin Panel
            </NavLink>
          )}
          {account ? (
            <button className="btn btn-ghost btn-sm" onClick={doLogout}>
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm" onClick={close}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={close}>
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
