import { useState } from 'react'
import { api } from '../../api.js'
import { useApi } from '../../hooks.js'
import { Loader, Modal, Notice, Pagination } from '../../components/ui.jsx'
import { CERTIFICATES } from '../../utils.js'

const blank = {
  title: '', description: '', genre: '', language: 'English', duration: 120, certificate: 'UA',
  director: '', cast: '', releaseDate: '', poster: '', trailerUrl: '',
}

function MovieForm({ movie, onClose, onSaved }) {
  const [f, setF] = useState(
    movie
      ? {
          ...blank,
          ...movie,
          genre: (movie.genre || []).join(', '),
          cast: (movie.cast || []).map((c) => (c.role ? `${c.name} | ${c.role}` : c.name)).join('\n'),
          releaseDate: movie.releaseDate ? movie.releaseDate.slice(0, 10) : '',
          poster: movie.poster || '',
          trailerUrl: movie.trailerUrl || '',
          director: movie.director || '',
          description: movie.description || '',
        }
      : blank
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const upd = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const body = {
      title: f.title,
      description: f.description,
      genre: f.genre.split(',').map((s) => s.trim()).filter(Boolean),
      language: f.language,
      duration: Number(f.duration),
      certificate: f.certificate,
      director: f.director,
      cast: f.cast
        .split('\n')
        .map((l) => {
          const [name, role] = l.split('|').map((s) => s.trim())
          return name ? { name, role } : null
        })
        .filter(Boolean),
      releaseDate: f.releaseDate,
      poster: f.poster,
      trailerUrl: f.trailerUrl,
    }
    try {
      if (movie) await api.put(`/movies/${movie._id}`, body)
      else await api.post('/movies', body)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={movie ? 'Edit movie' : 'Add movie'} onClose={onClose}>
      <form onSubmit={submit}>
        <Notice>{error}</Notice>
        <label className="field">Title<input required value={f.title} onChange={upd('title')} /></label>
        <label className="field">Description<textarea rows="3" value={f.description} onChange={upd('description')} /></label>
        <div className="two-col">
          <label className="field">Genres (comma separated)<input required placeholder="Action, Thriller" value={f.genre} onChange={upd('genre')} /></label>
          <label className="field">Language<input required value={f.language} onChange={upd('language')} /></label>
        </div>
        <div className="two-col">
          <label className="field">Duration (minutes)<input type="number" min="1" required value={f.duration} onChange={upd('duration')} /></label>
          <label className="field">Certificate
            <select value={f.certificate} onChange={upd('certificate')}>{CERTIFICATES.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
        </div>
        <div className="two-col">
          <label className="field">Release date<input type="date" required value={f.releaseDate} onChange={upd('releaseDate')} /></label>
          <label className="field">Director<input value={f.director} onChange={upd('director')} /></label>
        </div>
        <label className="field">Cast (one per line: Name | Role)<textarea rows="3" value={f.cast} onChange={upd('cast')} /></label>
        <label className="field">Poster image URL<input placeholder="https://..." value={f.poster} onChange={upd('poster')} /></label>
        <label className="field">Trailer URL<input placeholder="https://youtube.com/..." value={f.trailerUrl} onChange={upd('trailerUrl')} /></label>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Saving...' : 'Save movie'}</button>
      </form>
    </Modal>
  )
}

export default function AdminMovies() {
  const [page, setPage] = useState(1)
  const { data, error, loading, reload } = useApi(`/movies?limit=10&page=${page}&sort=newest`)
  const [editing, setEditing] = useState(null) // null | 'new' | movie
  const [msg, setMsg] = useState('')

  const remove = async (m) => {
    if (!window.confirm(`Remove "${m.title}"? Existing bookings keep working.`)) return
    try {
      await api.del(`/movies/${m._id}`)
      reload()
    } catch (err) {
      setMsg(err.message)
    }
  }

  return (
    <>
      <div className="row-between">
        <h1>Movies</h1>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>+ Add movie</button>
      </div>
      <Notice>{msg || error}</Notice>
      {loading && !data ? <Loader /> : data && (
        <>
          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr><th>Title</th><th>Genre</th><th>Language</th><th>Release</th><th>Status</th><th>Rating</th><th /></tr>
              </thead>
              <tbody>
                {data.movies.map((m) => (
                  <tr key={m._id}>
                    <td><b>{m.title}</b></td>
                    <td>{m.genre.join(', ')}</td>
                    <td>{m.language}</td>
                    <td>{new Date(m.releaseDate).toLocaleDateString('en-IN')}</td>
                    <td>{m.status === 'upcoming' ? 'Coming soon' : 'Now showing'}</td>
                    <td>{m.averageRating || '–'} ({m.ratingCount})</td>
                    <td className="actions">
                      <button className="link-btn" onClick={() => setEditing(m)}>Edit</button>
                      <button className="link-btn danger" onClick={() => remove(m)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {data.movies.length === 0 && <tr><td colSpan="7" className="muted">No movies yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
      {editing && (
        <MovieForm
          movie={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
    </>
  )
}
