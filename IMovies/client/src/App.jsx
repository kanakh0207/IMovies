import { Route, Routes, Link, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import { RequireAuth } from './components/ui.jsx'
import Home from './pages/Home.jsx'
import Movies from './pages/Movies.jsx'
import MovieDetail from './pages/MovieDetail.jsx'
import SeatSelection from './pages/SeatSelection.jsx'
import Checkout from './pages/Checkout.jsx'
import BookingDetail from './pages/BookingDetail.jsx'
import MyBookings from './pages/MyBookings.jsx'
import Favourites from './pages/Favourites.jsx'
import Profile from './pages/Profile.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import AdminLogin from './pages/admin/AdminLogin.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import AdminMovies from './pages/admin/AdminMovies.jsx'
import AdminTheatres from './pages/admin/AdminTheatres.jsx'
import AdminShows from './pages/admin/AdminShows.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import AdminBookings from './pages/admin/AdminBookings.jsx'

function NotFound() {
  return (
    <div className="container page center">
      <h1>404</h1>
      <p className="muted">That page doesn't exist.</p>
      <Link to="/" className="btn btn-primary">
        Back to home
      </Link>
    </div>
  )
}

export default function App() {
  const { pathname } = useLocation()
  const isAdminArea = pathname.startsWith('/admin') && pathname !== '/admin/login'

  return (
    <>
      {!isAdminArea && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/shows/:id/seats" element={<SeatSelection />} />
          <Route path="/checkout/:id" element={<RequireAuth role="user"><Checkout /></RequireAuth>} />
          <Route path="/bookings/:id" element={<RequireAuth><BookingDetail /></RequireAuth>} />
          <Route path="/my-bookings" element={<RequireAuth role="user"><MyBookings /></RequireAuth>} />
          <Route path="/favourites" element={<RequireAuth role="user"><Favourites /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth role="user"><Profile /></RequireAuth>} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<RequireAuth role="admin"><AdminLayout /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="movies" element={<AdminMovies />} />
            <Route path="theatres" element={<AdminTheatres />} />
            <Route path="shows" element={<AdminShows />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="bookings" element={<AdminBookings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdminArea && <Footer />}
    </>
  )
}
