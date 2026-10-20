import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApi } from '../hooks.js'
import MovieCard from '../components/MovieCard.jsx'
import { Empty, Loader, Notice, Pagination } from '../components/ui.jsx'
import { GENRES, LANGUAGES } from '../utils.js'

export default function Movies() {
  const [params, setParams] = useSearchParams()
  const search = params.get('search') || ''
  const genre = params.get('genre') || ''
  const language = params.get('language') || ''
  const status = params.get('status') || ''
  const sort = params.get('sort') || 'newest'
  const page = Number(params.get('page')) || 1
  const [text, setText] = useState(search)

  const set = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    if (!('page' in patch)) next.delete('page')
    setParams(next)
  }

  const qs = new URLSearchParams({ limit: '12', page: String(page), sort })
  if (search) qs.set('search', search)
  if (genre) qs.set('genre', genre)
  if (language) qs.set('language', language)
  if (status) qs.set('status', status)
  const { data, error, loading } = useApi(`/movies?${qs}`)

  return (
    <div className="container page">
      <h1>Movies</h1>
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault()
          set({ search: text.trim() })
        }}
      >
        <input placeholder="Search by title..." value={text} onChange={(e) => setText(e.target.value)} />
        <select value={genre} onChange={(e) => set({ genre: e.target.value })}>
          <option value="">All genres</option>
          {GENRES.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <select value={language} onChange={(e) => set({ language: e.target.value })}>
          <option value="">All languages</option>
          {LANGUAGES.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => set({ status: e.target.value })}>
          <option value="">Now showing & upcoming</option>
          <option value="now_showing">Now showing</option>
          <option value="upcoming">Coming soon</option>
        </select>
        <select value={sort} onChange={(e) => set({ sort: e.target.value })}>
          <option value="newest">Newest first</option>
          <option value="rating">Top rated</option>
          <option value="title">Title A–Z</option>
        </select>
        <button className="btn btn-primary">Search</button>
      </form>

      {loading && !data ? (
        <Loader />
      ) : error ? (
        <Notice>{error}</Notice>
      ) : data.movies.length ? (
        <>
          <p className="muted">{data.total} movie(s) found</p>
          <div className="movie-grid">
            {data.movies.map((m) => (
              <MovieCard key={m._id} movie={m} />
            ))}
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={(p) => set({ page: String(p) })} />
        </>
      ) : (
        <Empty>No movies match your filters.</Empty>
      )}
    </div>
  )
}
