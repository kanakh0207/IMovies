const pad = (n) => String(n).padStart(2, '0')

export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
export const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
export const fmtDateTime = (d) =>
  new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
export const dayKey = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`
}
export const toLocalInput = (d) => {
  const x = new Date(d)
  return `${dayKey(x)}T${pad(x.getHours())}:${pad(x.getMinutes())}`
}
export const runtime = (m) => `${Math.floor(m / 60)}h ${m % 60}m`

export const GENRES = ['Action', 'Adventure', 'Animation', 'Comedy', 'Drama', 'Family', 'Horror', 'Romance', 'Sci-Fi', 'Thriller']
export const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Marathi', 'Bengali']
export const CERTIFICATES = ['U', 'UA', 'A', 'S']
export const SEAT_TYPES = ['Regular', 'Premium', 'Recliner']
