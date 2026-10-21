import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function Loader({ text = 'Loading...' }) {
  return (
    <div className="loader">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  )
}

export function Notice({ type = 'error', children }) {
  if (!children) return null
  return <div className={`notice notice-${type}`}>{children}</div>
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>
}

export function Stars({ value = 0, count }) {
  return (
    <span className="stars" title={`${value} / 5`}>
      <span className="star-on">★</span> {value ? Number(value).toFixed(1) : 'New'}
      {count !== undefined && value ? <small> ({count})</small> : null}
    </span>
  )
}

export function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="star-input" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          className={n <= (hover || value) ? 'on' : ''}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null
  return (
    <div className="pagination">
      <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Prev
      </button>
      <span>
        Page {page} of {pages}
      </span>
      <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next →
      </button>
    </div>
  )
}

const BADGE = {
  confirmed: 'green',
  paid: 'green',
  pending: 'amber',
  unpaid: 'amber',
  cancelled: 'red',
  failed: 'red',
  expired: 'grey',
  refunded: 'blue',
}
export function StatusBadge({ status }) {
  return <span className={`badge badge-${BADGE[status] || 'grey'}`}>{status}</span>
}

// Wraps a route: role = 'user' | 'admin' | undefined (any logged-in account)
export function RequireAuth({ role, children }) {
  const { account, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loader />
  if (!account) {
    const to = role === 'admin' ? '/admin/login' : '/login'
    return <Navigate to={to} replace state={{ from: location.pathname + location.search }} />
  }
  if (role && account.role !== role) return <Navigate to={role === 'admin' ? '/admin/login' : '/'} replace />
  return children
}
