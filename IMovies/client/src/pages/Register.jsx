import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Notice } from '../components/ui.jsx'

export default function Register() {
  const { account, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (account) return <Navigate to="/" replace />

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setBusy(true)
    setError('')
    try {
      await register(form)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <h2>Create your account</h2>
        <Notice>{error}</Notice>
        <label className="field">
          Full name
          <input required value={form.name} onChange={upd('name')} />
        </label>
        <label className="field">
          Email
          <input type="email" required value={form.email} onChange={upd('email')} />
        </label>
        <label className="field">
          Phone (optional)
          <input value={form.phone} onChange={upd('phone')} />
        </label>
        <label className="field">
          Password (min 6 characters)
          <input type="password" required value={form.password} onChange={upd('password')} />
        </label>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Creating...' : 'Sign up'}
        </button>
        <p className="muted center">
          Already registered? <Link to="/login" state={{ from }}>Log in</Link>
        </p>
      </form>
    </div>
  )
}
