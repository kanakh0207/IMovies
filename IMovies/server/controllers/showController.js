const Show = require('../models/showModel');
const Movie = require('../models/movieModel');
const Theatre = require('../models/theatreModel');
const Favourite = require('../models/favouriteModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { buildSeatMap, releaseExpiredHolds } = require('../utils/seatUtils');
const { sendEmail, newShowEmail } = require('../utils/sendEmail');

// GET /api/shows?movie=&theatre=&city=&date=YYYY-MM-DD
exports.getShows = asyncHandler(async (req, res) => {
  const { movie, theatre, city, date } = req.query;
  const filter = { isActive: true };

  if (movie) filter.movie = movie;
  if (theatre) filter.theatre = theatre;
  if (city) {
    const ids = await Theatre.find({ city: { $regex: `^${city}$`, $options: 'i' }, isActive: true }).distinct('_id');
    filter.theatre = theatre ? { $in: ids.filter((i) => String(i) === theatre) } : { $in: ids };
  }

  if (date) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);
    if (isNaN(start)) throw new AppError('date must be YYYY-MM-DD', 400);
    filter.startTime = { $gte: start > new Date() ? start : new Date(), $lte: end };
  } else {
    filter.startTime = { $gte: new Date() };
  }

  const shows = await Show.find(filter)
    .sort({ startTime: 1 })
    .populate('movie', 'title poster language duration')
    .populate('theatre', 'name city address')
    .lean();

  const result = shows.map((s) => ({ ...s, bookedCount: s.bookedSeats.length }));
  res.json({ success: true, count: result.length, shows: result });
});

// GET /api/shows/:id  - includes the seat layout and live availability
exports.getShow = asyncHandler(async (req, res) => {
  await releaseExpiredHolds(req.params.id);

  const show = await Show.findOne({ _id: req.params.id, isActive: true })
    .populate('movie', 'title poster language duration certificate')
    .populate('theatre');
  if (!show) throw new AppError('Show not found', 404);

  const screen = show.theatre.screens.id(show.screenId);
  if (!screen) throw new AppError('Screen for this show no longer exists', 404);

  const seatMap = buildSeatMap(screen, show);
  const total = seatMap.reduce((n, r) => n + r.seats.length, 0);

  res.json({
    success: true,
    show: {
      _id: show._id,
      movie: show.movie,
      theatre: { _id: show.theatre._id, name: show.theatre.name, city: show.theatre.city, address: show.theatre.address },
      screenName: show.screenName,
      startTime: show.startTime,
      endTime: show.endTime,
      prices: show.prices,
    },
    totalSeats: total,
    availableSeats: total - show.bookedSeats.length,
    seatMap,
  });
});

// POST /api/shows  (admin)
// body: { movie, theatre, screenId, startTime, prices?: {Regular, Premium, Recliner} }
exports.createShow = asyncHandler(async (req, res) => {
  const { movie: movieId, theatre: theatreId, screenId, startTime, prices } = req.body;
  if (!movieId || !theatreId || !screenId || !startTime) {
    throw new AppError('movie, theatre, screenId and startTime are required', 400);
  }

  const [movie, theatre] = await Promise.all([
    Movie.findOne({ _id: movieId, isActive: true }),
    Theatre.findOne({ _id: theatreId, isActive: true }),
  ]);
  if (!movie) throw new AppError('Movie not found', 404);
  if (!theatre) throw new AppError('Theatre not found', 404);
  const screen = theatre.screens.id(screenId);
  if (!screen) throw new AppError('Screen not found in this theatre', 404);

  const start = new Date(startTime);
  if (isNaN(start)) throw new AppError('Invalid startTime', 400);
  if (start < new Date()) throw new AppError('startTime must be in the future', 400);
  // movie duration + 15 minutes cleaning buffer
  const end = new Date(start.getTime() + (movie.duration + 15) * 60000);

  // a screen can't host two overlapping shows
  const clash = await Show.exists({
    theatre: theatre._id,
    screenId: screen._id,
    isActive: true,
    startTime: { $lt: end },
    endTime: { $gt: start },
  });
  if (clash) throw new AppError('This screen already has a show during that time', 409);

  const show = await Show.create({
    movie: movie._id,
    theatre: theatre._id,
    screenId: screen._id,
    screenName: screen.name,
    startTime: start,
    endTime: end,
    ...(prices ? { prices } : {}),
  });

  // Notify users who saved this movie (fire-and-forget)
  Favourite.find({ movie: movie._id }).populate('user', 'name email').then((favs) => {
    const seen = new Set();
    favs.forEach((f) => {
      if (f.user && !seen.has(String(f.user._id))) {
        seen.add(String(f.user._id));
        sendEmail(newShowEmail(f.user, movie, theatre, show));
      }
    });
  }).catch((e) => console.error('Notify error', e.message));

  res.status(201).json({ success: true, show });
});

// PUT /api/shows/:id  (admin) - prices / isActive always; startTime only if nothing booked
exports.updateShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id).populate('movie', 'duration');
  if (!show) throw new AppError('Show not found', 404);

  if (req.body.prices) show.prices = { ...show.toObject().prices, ...req.body.prices };
  if (req.body.isActive !== undefined) show.isActive = req.body.isActive;

  if (req.body.startTime) {
    if (show.bookedSeats.length) throw new AppError('Cannot reschedule a show that already has bookings', 400);
    const start = new Date(req.body.startTime);
    if (isNaN(start)) throw new AppError('Invalid startTime', 400);
    const end = new Date(start.getTime() + (show.movie.duration + 15) * 60000);
    const clash = await Show.exists({
      _id: { $ne: show._id },
      theatre: show.theatre,
      screenId: show.screenId,
      isActive: true,
      startTime: { $lt: end },
      endTime: { $gt: start },
    });
    if (clash) throw new AppError('This screen already has a show during that time', 409);
    show.startTime = start;
    show.endTime = end;
  }

  await show.save();
  res.json({ success: true, show });
});

// DELETE /api/shows/:id  (admin)
exports.deleteShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);
  if (!show) throw new AppError('Show not found', 404);
  if (show.bookedSeats.length) {
    throw new AppError('This show has bookings. Cancel them first, or deactivate the show instead.', 400);
  }
  await show.deleteOne();
  res.json({ success: true, message: 'Show deleted' });
});
