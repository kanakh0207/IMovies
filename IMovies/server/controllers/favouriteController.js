const Favourite = require('../models/favouriteModel');
const Movie = require('../models/movieModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const TYPES = ['favourite', 'watchlist'];

// GET /api/favourites?type=favourite|watchlist
exports.getFavourites = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.type) {
    if (!TYPES.includes(req.query.type)) throw new AppError('type must be favourite or watchlist', 400);
    filter.type = req.query.type;
  }
  const items = await Favourite.find(filter).sort({ createdAt: -1 }).populate('movie');
  res.json({ success: true, count: items.length, items: items.filter((i) => i.movie) });
});

// POST /api/favourites   body: { movie, type }
exports.addFavourite = asyncHandler(async (req, res) => {
  const { movie, type = 'favourite' } = req.body;
  if (!TYPES.includes(type)) throw new AppError('type must be favourite or watchlist', 400);
  if (!(await Movie.exists({ _id: movie, isActive: true }))) throw new AppError('Movie not found', 404);
  if (await Favourite.exists({ user: req.user._id, movie, type })) throw new AppError(`Already in your ${type} list`, 409);
  const item = await Favourite.create({ user: req.user._id, movie, type });
  res.status(201).json({ success: true, item });
});

// DELETE /api/favourites/:movieId?type=favourite|watchlist
exports.removeFavourite = asyncHandler(async (req, res) => {
  const type = req.query.type || 'favourite';
  const removed = await Favourite.findOneAndDelete({ user: req.user._id, movie: req.params.movieId, type });
  if (!removed) throw new AppError(`Movie is not in your ${type} list`, 404);
  res.json({ success: true, message: 'Removed' });
});
