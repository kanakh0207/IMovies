import { Link } from 'react-router-dom'
import Poster from './Poster.jsx'
import { Stars } from './ui.jsx'

export default function MovieCard({ movie }) {
  return (
    <Link to={`/movies/${movie._id}`} className="movie-card">
      <div className="movie-card-img">
        <Poster movie={movie} />
        {movie.status === 'upcoming' && <span className="ribbon">Coming soon</span>}
        <span className="cert">{movie.certificate}</span>
      </div>
      <div className="movie-card-body">
        <h3>{movie.title}</h3>
        <p className="muted">{(movie.genre || []).join(' • ')}</p>
        <div className="row-between">
          <Stars value={movie.averageRating} count={movie.ratingCount} />
          <small className="muted">{movie.language}</small>
        </div>
      </div>
    </Link>
  )
}
