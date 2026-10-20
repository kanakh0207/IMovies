# TixBox — Movie ticket booking (MERN, JavaScript only)

* **server/** — Node.js + Express + MongoDB (Mongoose), JWT auth in an httpOnly cookie
* **client/** — React 19 + Vite + React Router (plain JS/JSX, no TypeScript)

## Features
**Customers:** register / login · browse, search and filter movies (genre, language, now showing / coming soon, sort) ·
movie page with cast, rating and showtimes by city and date · interactive seat map (max 10 seats, live availability) ·
10-minute seat hold with countdown · payment (card / UPI / net banking / wallet — simulated gateway) ·
e-ticket with booking ID and print · booking history and cancellation (up to 2 h before the show, refund simulated) ·
reviews & star ratings · favourites and watchlist (email when a watchlisted movie gets a show) · profile and password change.

**Admin (`/admin/login`):** dashboard (revenue, tickets sold, top movies, last 7 days) · manage movies ·
theatres and screens (custom seat layouts) · schedule shows with per-seat-type pricing (overlap protection) ·
view / cancel all bookings · activate, deactivate or delete users.

## 1. Install once
1. **Node.js 18 or newer** — https://nodejs.org (check with `node -v`)
2. **MongoDB**, either:
   * *Local:* MongoDB Community Server — https://www.mongodb.com/try/download/community
     (on Windows the installer runs it as a service, nothing else to start), **or**
   * *Cloud (no install):* free MongoDB Atlas cluster → copy its connection string and put it in `server/.env` as `MONGO_URI`.

## 2. Start the backend (terminal 1)
```bash
cd server
npm install
# open server/.env and change JWT_SECRET to any long random text
npm run seed      # creates the admin account + sample movies, theatre and shows
npm run dev       # API on http://localhost:5000
```
Check it: open http://localhost:5000/api/health → `{"success":true,...}`

## 3. Start the frontend (terminal 2)
```bash
cd client
npm install
npm run dev       # site on http://localhost:5173
```
Open **http://localhost:5173**. The Vite dev server forwards `/api` to port 5000, so no CORS or cookie setup is needed.

## 4. Try it
| What | Where | Login |
|---|---|---|
| Customer | http://localhost:5173/register (create any account) | your own email/password |
| Admin | http://localhost:5173/admin/login | `admin@imovies.com` / `Admin@123` (from `server/.env`) |

Booking flow: open a movie → pick a showtime → choose seats → **Proceed to payment** → pay.
Demo payments: card = any 16 digits (a number ending `0000` is declined), UPI = any `name@bank`, net banking / wallet always succeed.
Booking emails print in the **server terminal** unless you fill the `SMTP_*` values in `server/.env`.

To get more shows: log in as admin → Theatres & screens (a sample theatre exists) → Shows → *Schedule show*.

## Troubleshooting
| Problem | Fix |
|---|---|
| `Could not connect to MongoDB` | MongoDB isn't running (start the service) or `MONGO_URI` is wrong. |
| `npm run seed` says data already present | Fine — it only seeds an empty database. To reset: drop the `imovies` database in MongoDB Compass / `mongosh`. |
| Site loads but movies/login fail with 500 / "proxy error" | Backend isn't running on port 5000. Start terminal 1 first. |
| Port 5000 busy (macOS AirPlay uses it) | Change `PORT` in `server/.env` **and** the `target` in `client/vite.config.js`. |
| "No upcoming shows" | Sample shows are scheduled 1 day ahead. After that, schedule new ones from the admin panel. |

## Production build
```bash
cd client && npm run build      # outputs client/dist
```
Serve `dist/` from any static host. If the API is on another domain, set `VITE_API_URL=https://api.example.com/api`
before building, set `CLIENT_URL` on the server to the site's URL, and `NODE_ENV=production` (cookies become `secure; sameSite=none`, so use HTTPS).

## API summary (base `/api`)
| Area | Endpoints |
|---|---|
| Auth | POST /auth/register, /auth/login, /auth/logout · GET/PUT /auth/me |
| Admin | POST /admin/login · GET /admin/dashboard · GET /admin/users, /admin/users/:id · PUT/DELETE /admin/users/:id · GET /admin/bookings |
| Movies | GET /movies (?search&genre&language&status&sort&page&limit), GET /movies/:id · admin: POST, PUT, DELETE |
| Theatres | GET /theatres (?city), GET /theatres/:id · admin: POST, PUT, DELETE, POST/PUT/DELETE /theatres/:id/screens[/:screenId] |
| Shows | GET /shows (?movie&theatre&city&date), GET /shows/:id (seat map + availability) · admin: POST, PUT, DELETE |
| Bookings | POST /bookings (hold seats) · POST /bookings/:id/pay · GET /bookings/my · GET /bookings/:id · PUT /bookings/:id/cancel |
| Reviews | GET /reviews/movie/:movieId · POST /reviews · PUT/DELETE /reviews/:id |
| Favourites | GET /favourites?type · POST /favourites {movie,type} · DELETE /favourites/:movieId?type |
