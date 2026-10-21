import { useState } from 'react'
import { api } from '../../api.js'
import { useApi } from '../../hooks.js'
import { Loader, Notice, Pagination } from '../../components/ui.jsx'

export default function AdminUsers() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [text, setText] = useState('')
  const { data, error, loading, reload } = useApi(`/admin/users?limit=15&page=${page}&search=${encodeURIComponent(search)}`)
  const [msg, setMsg] = useState('')

  const run = async (fn) => {
    setMsg('')
    try {
      await fn()
      reload()
    } catch (err) {
      setMsg(err.message)
    }
  }

  return (
    <>
      <h1>Users</h1>
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setSearch(text.trim())
        }}
      >
        <input placeholder="Search name or email..." value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-primary">Search</button>
      </form>
      <Notice>{msg || error}</Notice>
      {loading && !data ? <Loader /> : data && (
        <>
          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u._id}>
                    <td><b>{u.name}</b></td>
                    <td>{u.email}</td>
                    <td>{u.phone || '–'}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td><span className={`badge badge-${u.isActive ? 'green' : 'red'}`}>{u.isActive ? 'active' : 'deactivated'}</span></td>
                    <td className="actions">
                      <button className="link-btn" onClick={() => run(() => api.put(`/admin/users/${u._id}`, { isActive: !u.isActive }))}>
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="link-btn danger"
                        onClick={() => window.confirm(`Delete ${u.email}?`) && run(() => api.del(`/admin/users/${u._id}`))}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {data.users.length === 0 && <tr><td colSpan="6" className="muted">No users found.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </>
  )
}
