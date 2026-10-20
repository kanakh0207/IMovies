import { useState } from 'react'
import { api } from '../api.js'
import { useApi } from '../hooks.js'
import MovieCard from '../components/MovieCard.jsx'
import { Empty, Loader, Notice } from '../components/ui.jsx'

export default function Favourites() {
  const [type, setType] = useState('favourite')
  const { data, error, loading, reload } = useApi(`/favourites?type=${type}`)
  const [msg, setMsg] = useState('')

  const remove = async (movieId) => {
    try {
      await api.del(`/favourites/${movieId}?type=${type}`)
      reload()
    } catch (err) {
      setMsg(err.message)
    }
  }

  return (
    <div className="container page">
      <h1>My lists</h1>
      <div className="tabs">
        <button className={type === 'favourite' ? 'tab active' : 'tab'} onClick={() => setType('favourite')}>
          ♥ Favourites
        </button>
        <button className={type === 'watchlist' ? 'tab active' : 'tab'} onClick={() => setType('watchlist')}>
          🔔 Watchlist
        </button>
      </div>
      <Notice>{msg || error}</Notice>
      {loading && !data ? (
        <Loader />
      ) : data && data.items.length ? (
        <div className="movie-grid">
          {data.items.map((i) => (
            <div key={i._id} className="fav-item">
              <MovieCard movie={i.movie} />
              <button className="btn btn-ghost btn-sm btn-block" onClick={() => remove(i.movie._id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Empty>
          {type === 'watchlist'
            ? 'Add upcoming movies to your watchlist and we will email you when bookings open.'
            : 'No favourites yet. Tap the heart on any movie.'}
        </Empty>
      )}
    </div>
  )
}
