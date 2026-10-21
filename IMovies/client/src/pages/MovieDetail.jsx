import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { useApi } from '../hooks.js'
import { useAuth } from '../context/AuthContext.jsx'
import Poster from '../components/Poster.jsx'
import { Empty, Loader, Notice, StarInput, Stars } from '../components/ui.jsx'
import { dayKey, fmtDate, fmtTime, inr, runtime } from '../utils.js'

function ReviewForm({ movieId, existing, onDone }) {
  const [rating, setRating] = useState(existing?.rating || 0)
  const [comment, setComment] = useState(existing?.comment || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!rating) return setError('Please choose a star rating')
    setBusy(true)
    setError('')
    try {
      if (existing) await api.put(`/reviews/${existing._id}`, { rating, comment })
      else await api.post('/reviews', { movie: movieId, rating, comment })
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card review-form" onSubmit={submit}>
      <h4>{existing ? 'Edit your review' : 'Write a review'}</h4>
      <Notice>{error}</Notice>
      <StarInput value={rating} onChange={setRating} />
      <textarea rows="3" maxLength="1000" placeholder="What did you think?" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button className="btn btn-primary btn-sm" disabled={busy}>
        {existing ? 'Update review' : 'Submit review'}
      </button>
    </form>
  )
}

function Showtimes({ shows }) {
  const cities = [...new Set(shows.map((s) => s.theatre.city))]
  const [city, setCity] = useState('')
  const [day, setDay] = useState('')

  const activeCity = cities.includes(city) ? city : cities[0]
  const inCity = shows.filter((s) => s.theatre.city === activeCity)
  const days = [...new Set(inCity.map((s) => dayKey(s.startTime)))]
  const activeDay = days.includes(day) ? day : days[0]
  const today = inCity.filter((s) => dayKey(s.startTime) === activeDay)

  const byTheatre = {}
  today.forEach((s) => {
    ;(byTheatre[s.theatre._id] ||= { theatre: s.theatre, shows: [] }).shows.push(s)
  })

  return (
    <>
      <div className="row gap">
        <select value={activeCity} onChange={(e) => setCity(e.target.value)}>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <div className="tabs">
          {days.map((d) => (
            <button key={d} className={d === activeDay ? 'tab active' : 'tab'} onClick={() => setDay(d)}>
              {fmtDate(d + 'T12:00:00')}
            </button>
          ))}
        </div>
      </div>
      {Object.values(byTheatre).map(({ theatre, shows: list }) => (
        <div className="card theatre-row" key={theatre._id}>
          <div>
            <strong>{theatre.name}</strong>
            <p className="muted">{theatre.address}</p>
          </div>
          <div className="showtimes">
            {list.map((s) => (
              <Link key={s._id} to={`/shows/${s._id}/seats`} className="showtime">
                <b>{fmtTime(s.startTime)}</b>
                <small>
                  {s.screenName} · from {inr(Math.min(...Object.values(s.prices || { x: 0 })))}
                </small>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

export default function MovieDetail() {
  const { id } = useParams()
  const { account } = useAuth()
  const navigate = useNavigate()
  const isUser = account?.role === 'user'

  const movie = useApi(`/movies/${id}`)
  const shows = useApi(`/shows?movie=${id}`)
  const reviews = useApi(`/reviews/movie/${id}?limit=50`)
  const saved = useApi(isUser ? '/favourites' : null)
  const [msg, setMsg] = useState('')

  if (movie.loading && !movie.data) return <Loader />
  if (movie.error) return <div className="container page"><Notice>{movie.error}</Notice></div>

  const m = movie.data.movie
  const savedItems = saved.data?.items || []
  const has = (type) => savedItems.some((i) => i.movie._id === id && i.type === type)

  const toggle = async (type) => {
    if (!account) return navigate('/login', { state: { from: `/movies/${id}` } })
    if (!isUser) return setMsg('Admin accounts cannot save movies.')
    setMsg('')
    try {
      if (has(type)) await api.del(`/favourites/${id}?type=${type}`)
      else await api.post('/favourites', { movie: id, type })
      saved.reload()
    } catch (err) {
      setMsg(err.message)
    }
  }

  const removeReview = async (rid) => {
    if (!window.confirm('Delete this review?')) return
    try {
      await api.del(`/reviews/${rid}`)
      reviews.reload()
      movie.reload()
    } catch (err) {
      setMsg(err.message)
    }
  }

  const refresh = () => {
    reviews.reload()
    movie.reload()
  }

  const list = reviews.data?.reviews || []
  const own = isUser ? list.find((r) => r.user && r.user._id === account._id) : null
  const upcoming = m.status === 'upcoming'

  return (
    <>
      <section className="detail-hero">
        <div className="container detail-grid">
          <Poster movie={m} className="detail-poster" />
          <div>
            <h1>{m.title}</h1>
            <div className="row gap wrap">
              <Stars value={m.averageRating} count={m.ratingCount} />
              <span className="pill">{m.certificate}</span>
              <span className="pill">{runtime(m.duration)}</span>
              <span className="pill">{m.language}</span>
            </div>
            <p className="muted">{(m.genre || []).join(' • ')}</p>
            <p>{m.description}</p>
            <p className="muted">
              Release: {new Date(m.releaseDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}
              {m.director ? ` · Director: ${m.director}` : ''}
            </p>
            {m.cast?.length > 0 && (
              <p>
                <b>Cast:</b> {m.cast.map((c) => (c.role ? `${c.name} (${c.role})` : c.name)).join(', ')}
              </p>
            )}
            <div className="row gap wrap">
              {!upcoming && (
                <a href="#showtimes" className="btn btn-primary">
                  Book tickets
                </a>
              )}
              <button className="btn btn-ghost" onClick={() => toggle('favourite')}>
                {has('favourite') ? '♥ In favourites' : '♡ Add to favourites'}
              </button>
              {upcoming && (
                <button className="btn btn-ghost" onClick={() => toggle('watchlist')}>
                  {has('watchlist') ? '🔔 On watchlist' : '🔔 Notify me when booking opens'}
                </button>
              )}
              {m.trailerUrl && (
                <a className="btn btn-ghost" href={m.trailerUrl} target="_blank" rel="noreferrer">
                  ▶ Trailer
                </a>
              )}
            </div>
            <Notice>{msg}</Notice>
          </div>
        </div>
      </section>

      <div className="container page">
        <section id="showtimes">
          <h2>Showtimes</h2>
          {shows.loading && !shows.data ? (
            <Loader />
          ) : shows.error ? (
            <Notice>{shows.error}</Notice>
          ) : shows.data.shows.length ? (
            <Showtimes shows={shows.data.shows} />
          ) : (
            <Empty>{upcoming ? 'Bookings have not opened yet.' : 'No upcoming shows scheduled.'}</Empty>
          )}
        </section>

        <section>
          <h2>Reviews</h2>
          {isUser && !reviews.loading && <ReviewForm key={own?._id || 'new'} movieId={id} existing={own} onDone={refresh} />}
          {!account && (
            <p className="muted">
              <Link to="/login" state={{ from: `/movies/${id}` }}>Log in</Link> to write a review.
            </p>
          )}
          {reviews.error && <Notice>{reviews.error}</Notice>}
          {list.length === 0 && !reviews.loading && <Empty>No reviews yet. Be the first!</Empty>}
          {list.map((r) => (
            <div className="card review" key={r._id}>
              <div className="row-between">
                <strong>{r.user?.name || 'Former user'}</strong>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p>{r.comment}</p>}
              <div className="row-between">
                <small className="muted">{new Date(r.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</small>
                {(account?.role === 'admin' || (r.user && r.user._id === account?._id)) && (
                  <button className="link-btn danger" onClick={() => removeReview(r._id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  )
}
