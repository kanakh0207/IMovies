import { useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Notice } from '../components/ui.jsx'

export default function Profile() {
  const { account, updateAccount } = useAuth()
  const [form, setForm] = useState({ name: account.name || '', phone: account.phone || '', currentPassword: '', newPassword: '' })
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [busy, setBusy] = useState(false)

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMsg({ type: '', text: '' })
    const body = { name: form.name, phone: form.phone }
    if (form.newPassword) {
      body.currentPassword = form.currentPassword
      body.newPassword = form.newPassword
    }
    try {
      const res = await api.put('/auth/me', body)
      updateAccount({ name: res.user.name, phone: res.user.phone })
      setForm({ ...form, currentPassword: '', newPassword: '' })
      setMsg({ type: 'success', text: 'Profile updated.' })
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <h2>My profile</h2>
        <Notice type={msg.type}>{msg.text}</Notice>
        <label className="field">
          Email
          <input value={account.email} disabled />
        </label>
        <label className="field">
          Name
          <input required value={form.name} onChange={upd('name')} />
        </label>
        <label className="field">
          Phone
          <input value={form.phone} onChange={upd('phone')} />
        </label>
        <h4>Change password</h4>
        <label className="field">
          Current password
          <input type="password" value={form.currentPassword} onChange={upd('currentPassword')} />
        </label>
        <label className="field">
          New password
          <input type="password" minLength="6" value={form.newPassword} onChange={upd('newPassword')} />
        </label>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
