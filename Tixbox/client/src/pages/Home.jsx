import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApi } from '../hooks.js'
import MovieCard from '../components/MovieCard.jsx'
import { Empty, Loader, Notice } from '../components/ui.jsx'
import { GENRES } from '../utils.js'

function Section({ title, link, state }) {
  const movies = state.data?.movies || []
  return (
    <section className="container section">
      <div className="row-between">
        <h2>{title}</h2>
        <Link to={link} className="muted">
          View all →
        </Link>
      </div>
      {state.loading && !state.data ? (
        <Loader />
      ) : state.error ? (
        <Notice>{state.error}</Notice>
      ) : movies.length ? (
        <div className="movie-grid">
          {movies.map((m) => (
            <MovieCard key={m._id} movie={m} />
          ))}
        </div>
      ) : (
        <Empty>No movies here yet.</Empty>
      )}
    </section>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const nowShowing = useApi('/movies?status=now_showing&sort=newest&limit=8')
  const upcoming = useApi('/movies?status=upcoming&limit=4')

  const search = (e) => {
    e.preventDefault()
    navigate(`/movies?search=${encodeURIComponent(q.trim())}`)
  }

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <h1>
            Book your next <span className="accent">movie night</span> in seconds
          </h1>
          <p>Pick a movie, choose your seats, pay securely and get your e-ticket instantly.</p>
          <form className="hero-search" onSubmit={search}>
            <input placeholder="Search for a movie..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn btn-primary">Search</button>
          </form>
          <div className="chips">
            {GENRES.map((g) => (
              <Link key={g} to={`/movies?genre=${encodeURIComponent(g)}`} className="chip">
                {g}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Section title="Now showing" link="/movies?status=now_showing" state={nowShowing} />
      <Section title="Coming soon" link="/movies?status=upcoming" state={upcoming} />
    </>
  )
}
