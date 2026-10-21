const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const Movie = require('../models/movieModel');
const Theatre = require('../models/theatreModel');
const Show = require('../models/showModel');
const Review = require('../models/reviewModel');
const Favourite = require('../models/favouriteModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendToken } = require('../utils/generateToken');

// POST /api/admin/login
exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);
  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
  if (!admin || !(await admin.matchPassword(password))) throw new AppError('Invalid admin credentials', 401);
  sendToken(res, 200, admin, 'admin');
});

// GET /api/admin/dashboard  - overview + report data
exports.getDashboard = asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const confirmed = { status: 'confirmed' };

  const [users, movies, theatres, upcomingShows, bookingsByStatus, revenueAgg, topMovies, daily] = await Promise.all([
    User.countDocuments(),
    Movie.countDocuments({ isActive: true }),
    Theatre.countDocuments({ isActive: true }),
    Show.countDocuments({ isActive: true, startTime: { $gte: new Date() } }),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.aggregate([{ $match: confirmed }, { $group: { _id: null, revenue: { $sum: '$totalAmount' }, tickets: { $sum: { $size: '$seats' } } } }]),
    Booking.aggregate([
      { $match: confirmed },
      { $group: { _id: '$movie', revenue: { $sum: '$totalAmount' }, tickets: { $sum: { $size: '$seats' } } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'movies', localField: '_id', foreignField: '_id', as: 'movie' } },
      { $unwind: '$movie' },
      { $project: { _id: 0, movieId: '$_id', title: '$movie.title', revenue: 1, tickets: 1 } },
    ]),
    Booking.aggregate([
      { $match: { ...confirmed, createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, bookings: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({
    success: true,
    stats: {
      users,
      movies,
      theatres,
      upcomingShows,
      totalRevenue: revenueAgg[0] ? revenueAgg[0].revenue : 0,
      ticketsSold: revenueAgg[0] ? revenueAgg[0].tickets : 0,
      bookingsByStatus: Object.fromEntries(bookingsByStatus.map((b) => [b._id, b.count])),
    },
    topMovies,
    last7Days: daily.map((d) => ({ date: d._id, bookings: d.bookings, revenue: d.revenue })),
  });
});

// GET /api/admin/users?search=&page=&limit=
exports.getUsers = asyncHandler(async (req, res) => {
  const p = Math.max(Number(req.query.page) || 1, 1);
  const l = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = {};
  if (req.query.search) {
    const rx = { $regex: req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, total, page: p, pages: Math.ceil(total / l), users });
});

// GET /api/admin/users/:id
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  const bookings = await Booking.find({ user: user._id }).sort({ createdAt: -1 }).limit(20).populate('movie', 'title');
  res.json({ success: true, user, bookings });
});

// PUT /api/admin/users/:id   body: { name?, phone?, isActive? }
exports.updateUser = asyncHandler(async (req, res) => {
  const allowed = {};
  ['name', 'phone', 'isActive'].forEach((k) => { if (req.body[k] !== undefined) allowed[k] = req.body[k]; });
  const user = await User.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true });
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, user });
});

// DELETE /api/admin/users/:id
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (await Booking.exists({ user: user._id, status: { $in: ['pending', 'confirmed'] } })) {
    throw new AppError('User has active bookings. Deactivate the account instead (isActive: false).', 400);
  }
  const reviews = await Review.find({ user: user._id });
  await Promise.all([Review.deleteMany({ user: user._id }), Favourite.deleteMany({ user: user._id }), user.deleteOne()]);
  await Promise.all([...new Set(reviews.map((r) => String(r.movie)))].map((m) => Review.recalculate(m)));
  res.json({ success: true, message: 'User deleted' });
});

// GET /api/admin/bookings?status=&movie=&user=&page=&limit=
exports.getAllBookings = asyncHandler(async (req, res) => {
  const p = Math.max(Number(req.query.page) || 1, 1);
  const l = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = {};
  ['status', 'movie', 'user', 'theatre'].forEach((k) => { if (req.query[k]) filter[k] = req.query[k]; });
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .populate('user', 'name email')
      .populate('movie', 'title')
      .populate('theatre', 'name city')
      .populate('show', 'startTime screenName'),
    Booking.countDocuments(filter),
  ]);
  res.json({ success: true, total, page: p, pages: Math.ceil(total / l), bookings });
});
