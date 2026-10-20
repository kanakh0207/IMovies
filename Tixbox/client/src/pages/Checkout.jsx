import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { useApi } from '../hooks.js'
import { Loader, Notice } from '../components/ui.jsx'
import { fmtDateTime, inr } from '../utils.js'

const METHODS = [
  { id: 'card', label: 'Card' },
  { id: 'upi', label: 'UPI' },
  { id: 'netbanking', label: 'Net banking' },
  { id: 'wallet', label: 'Wallet' },
]
const BANKS = ['HDFC Bank', 'SBI', 'ICICI Bank', 'Axis Bank', 'Kotak Bank']
const WALLETS = ['Paytm', 'PhonePe', 'Amazon Pay']

const groupCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

export default function Checkout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, error, loading } = useApi(`/bookings/${id}`)
  const [now, setNow] = useState(Date.now())
  const [method, setMethod] = useState('card')
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [upi, setUpi] = useState('')
  const [bank, setBank] = useState(BANKS[0])
  const [wallet, setWallet] = useState(WALLETS[0])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (loading && !data) return <Loader />
  if (error) return <div className="container page"><Notice>{error}</Notice></div>

  const b = data.booking
  if (b.status === 'confirmed') return <Navigate to={`/bookings/${id}`} replace />

  const left = b.expiresAt ? new Date(b.expiresAt).getTime() - now : 0
  const dead = b.status !== 'pending' || left <= 0
  const mm = String(Math.max(0, Math.floor(left / 60000))).padStart(2, '0')
  const ss = String(Math.max(0, Math.floor((left % 60000) / 1000))).padStart(2, '0')

  const pay = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    const details =
      method === 'card'
        ? { cardNumber: card.number }
        : method === 'upi'
          ? { upiId: upi }
          : method === 'netbanking'
            ? { bank }
            : { wallet }
    try {
      await api.post(`/bookings/${id}/pay`, { method, details })
      navigate(`/bookings/${id}`, { replace: true, state: { justBooked: true } })
    } catch (err) {
      setMsg(err.message)
    } finally {
      setBusy(false)
    }
  }

  const release = async () => {
    try {
      await api.put(`/bookings/${id}/cancel`)
    } catch {
      /* hold may already have expired - nothing to release */
    }
    navigate(`/movies/${b.movie._id}`)
  }

  return (
    <div className="container page checkout-grid">
      <section>
        <h1>Payment</h1>
        {dead ? (
          <div className="card">
            <Notice>This seat hold has expired or was cancelled. Please select your seats again.</Notice>
            <Link to={`/movies/${b.movie._id}`} className="btn btn-primary">
              Choose seats again
            </Link>
          </div>
        ) : (
          <form className="card" onSubmit={pay}>
            <div className="timer">
              Complete payment in <b>{mm}:{ss}</b>
            </div>
            <div className="tabs">
              {METHODS.map((m) => (
                <button type="button" key={m.id} className={m.id === method ? 'tab active' : 'tab'} onClick={() => setMethod(m.id)}>
                  {m.label}
                </button>
              ))}
            </div>

            {method === 'card' && (
              <>
                <label className="field">
                  Card number
                  <input inputMode="numeric" placeholder="4111 1111 1111 1111" required value={card.number} onChange={(e) => setCard({ ...card, number: groupCard(e.target.value) })} />
                </label>
                <label className="field">
                  Name on card
                  <input required value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                </label>
                <div className="two-col">
                  <label className="field">
                    Expiry (MM/YY)
                    <input placeholder="08/29" required maxLength="5" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
                  </label>
                  <label className="field">
                    CVV
                    <input type="password" inputMode="numeric" maxLength="4" required value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })} />
                  </label>
                </div>
                <p className="muted small">Demo payment: any 16-digit number works. A number ending in 0000 is declined.</p>
              </>
            )}
            {method === 'upi' && (
              <label className="field">
                UPI ID
                <input placeholder="name@upi" required value={upi} onChange={(e) => setUpi(e.target.value)} />
              </label>
            )}
            {method === 'netbanking' && (
              <label className="field">
                Choose your bank
                <select value={bank} onChange={(e) => setBank(e.target.value)}>
                  {BANKS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            )}
            {method === 'wallet' && (
              <label className="field">
                Choose wallet
                <select value={wallet} onChange={(e) => setWallet(e.target.value)}>
                  {WALLETS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            )}

            <Notice>{msg}</Notice>
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Processing...' : `Pay ${inr(b.totalAmount)}`}
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={release}>
              Cancel & release seats
            </button>
          </form>
        )}
      </section>

      <aside className="card summary">
        <h3>{b.movie.title}</h3>
        <p className="muted">
          {b.theatre.name}, {b.theatre.city}
          <br />
          {b.show.screenName} · {fmtDateTime(b.show.startTime)}
        </p>
        <div className="chips">
          {b.seats.map((s) => (
            <span key={s.seatId} className="chip">
              {s.seatId}
            </span>
          ))}
        </div>
        {b.seats.map((s) => (
          <div className="row-between small" key={s.seatId}>
            <span>
              {s.seatId} · {s.type}
            </span>
            <span>{inr(s.price)}</span>
          </div>
        ))}
        <div className="row-between total">
          <span>Total</span>
          <b>{inr(b.totalAmount)}</b>
        </div>
      </aside>
    </div>
  )
}
