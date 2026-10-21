const Review = require('../models/reviewModel');
const Movie = require('../models/movieModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/reviews/movie/:movieId?page=&limit=
exports.getMovieReviews = asyncHandler(async (req, res) => {
  const p = Math.max(Number(req.query.page) || 1, 1);
  const l = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const filter = { movie: req.params.movieId };
  const [reviews, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).populate('user', 'name'),
    Review.countDocuments(filter),
  ]);
  res.json({ success: true, total, page: p, pages: Math.ceil(total / l), reviews });
});

// POST /api/reviews   body: { movie, rating, comment }
exports.createReview = asyncHandler(async (req, res) => {
  const { movie, rating, comment } = req.body;
  if (!movie) throw new AppError('movie is required', 400);
  if (!(await Movie.exists({ _id: movie, isActive: true }))) throw new AppError('Movie not found', 404);
  if (await Review.exists({ user: req.user._id, movie })) {
    throw new AppError('You have already reviewed this movie. Edit your review instead.', 409);
  }
  const review = await Review.create({ user: req.user._id, movie, rating, comment });
  await Review.recalculate(movie);
  res.status(201).json({ success: true, review });
});

// PUT /api/reviews/:id  (owner)
exports.updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);
  if (String(review.user) !== String(req.user._id)) throw new AppError('You can only edit your own review', 403);
  if (req.body.rating !== undefined) review.rating = req.body.rating;
  if (req.body.comment !== undefined) review.comment = req.body.comment;
  await review.save();
  await Review.recalculate(review.movie);
  res.json({ success: true, review });
});

// DELETE /api/reviews/:id  (owner or admin)
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);
  if (req.role !== 'admin' && String(review.user) !== String(req.user._id)) {
    throw new AppError('You can only delete your own review', 403);
  }
  await review.deleteOne();
  await Review.recalculate(review.movie);
  res.json({ success: true, message: 'Review deleted' });
});
