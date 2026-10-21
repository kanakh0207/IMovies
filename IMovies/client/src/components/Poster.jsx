import { useState } from 'react'

const hue = (s = '') => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)

// Shows the poster image, or a generated gradient with the title when there is no image
export default function Poster({ movie, className = '' }) {
  const [broken, setBroken] = useState(false)
  if (movie.poster && !broken) {
    return <img className={`poster ${className}`} src={movie.poster} alt={movie.title} onError={() => setBroken(true)} />
  }
  const h = hue(movie.title)
  return (
    <div
      className={`poster poster-fallback ${className}`}
      style={{ background: `linear-gradient(160deg, hsl(${h} 65% 36%), hsl(${(h + 55) % 360} 55% 12%))` }}
    >
      <span>{movie.title}</span>
    </div>
  )
}
