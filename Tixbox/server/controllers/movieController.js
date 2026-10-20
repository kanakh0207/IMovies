const Movie = require('../models/movieModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/movies?search=&genre=&language=&status=now_showing|upcoming&sort=&page=&limit=
exports.getMovies = asyncHandler(async (req, res) => {
  const { search, genre, language, status, sort, page = 1, limit = 12 } = req.query;
  const filter = { isActive: true };

  if (search) filter.title = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  if (genre) filter.genre = { $regex: `^${genre}$`, $options: 'i' };
  if (language) filter.language = { $regex: `^${language}$`, $options: 'i' };
  if (status === 'upcoming') filter.releaseDate = { $gt: new Date() };
  if (status === 'now_showing') filter.releaseDate = { $lte: new Date() };

  const sortMap = { rating: { averageRating: -1 }, newest: { releaseDate: -1 }, title: { title: 1 } };
  const p = Math.max(Number(page), 1);
  const l = Math.min(Math.max(Number(limit), 1), 50);

  const [movies, total] = await Promise.all([
    Movie.find(filter).sort(sortMap[sort] || { releaseDate: -1 }).skip((p - 1) * l).limit(l),
    Movie.countDocuments(filter),
  ]);

  res.json({ success: true, total, page: p, pages: Math.ceil(total / l), count: movies.length, movies });
});

// GET /api/movies/:id
exports.getMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findOne({ _id: req.params.id, isActive: true });
  if (!movie) throw new AppError('Movie not found', 404);
  res.json({ success: true, movie });
});

// POST /api/movies  (admin)
exports.createMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.create(req.body);
  res.status(201).json({ success: true, movie });
});

// PUT /api/movies/:id  (admin)
exports.updateMovie = asyncHandler(async (req, res) => {
  // rating fields are calculated from reviews, never set manually
  delete req.body.averageRating;
  delete req.body.ratingCount;
  const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!movie) throw new AppError('Movie not found', 404);
  res.json({ success: true, movie });
});

// DELETE /api/movies/:id  (admin) - soft delete so old bookings keep working
exports.deleteMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!movie) throw new AppError('Movie not found', 404);
  res.json({ success: true, message: 'Movie removed' });
});
