import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container row-between">
        <span>
          © {new Date().getFullYear()} iMovies — movie ticket booking made simple.
        </span>
        <Link to="/admin/login" className="muted">
          Admin
        </Link>
      </div>
    </footer>
  )
}
