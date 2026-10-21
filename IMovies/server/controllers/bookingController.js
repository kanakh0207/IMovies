const Booking = require('../models/bookingModel');
const Show = require('../models/showModel');
const Theatre = require('../models/theatreModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { buildSeatLookup, releaseExpiredHolds } = require('../utils/seatUtils');
const { processPayment } = require('../utils/paymentGateway');
const { sendEmail, bookingConfirmationEmail, bookingCancelledEmail } = require('../utils/sendEmail');

const MAX_SEATS = 10;
const populateBooking = (q) =>
  q.populate('movie', 'title poster language duration')
    .populate('theatre', 'name city address')
    .populate('show', 'startTime endTime screenName');

// POST /api/bookings   body: { showId, seats: ["A1","A2"] }
// Step 1: holds the seats (status "pending") for SEAT_HOLD_MINUTES. Pay with POST /:id/pay
exports.createBooking = asyncHandler(async (req, res) => {
  const { showId, seats } = req.body;
  if (!showId) throw new AppError('showId is required', 400);
  if (!Array.isArray(seats) || seats.length === 0) throw new AppError('Select at least one seat', 400);
  if (seats.length > MAX_SEATS) throw new AppError(`You can book at most ${MAX_SEATS} seats at a time`, 400);

  const seatIds = [...new Set(seats.map((s) => String(s).toUpperCase().trim()))];
  if (seatIds.length !== seats.length) throw new AppError('Duplicate seats selected', 400);

  await releaseExpiredHolds(showId);

  const show = await Show.findOne({ _id: showId, isActive: true });
  if (!show) throw new AppError('Show not found', 404);
  if (show.startTime <= new Date()) throw new AppError('This show has already started', 400);

  const theatre = await Theatre.findById(show.theatre);
  const screen = theatre && theatre.screens.id(show.screenId);
  if (!screen) throw new AppError('Screen not found for this show', 404);

  const lookup = buildSeatLookup(screen);
  const seatDetails = seatIds.map((id) => {
    const seat = lookup[id];
    if (!seat) throw new AppError(`Seat ${id} does not exist in this screen`, 400);
    return { seatId: id, type: seat.type, price: show.prices[seat.type] };
  });
  const totalAmount = seatDetails.reduce((sum, s) => sum + s.price, 0);

  // Atomic hold: succeeds only if NONE of the requested seats is already taken,
  // so two people can never get the same seat.
  const held = await Show.findOneAndUpdate(
    { _id: show._id, bookedSeats: { $nin: seatIds } },
    { $push: { bookedSeats: { $each: seatIds } } },
    { new: true }
  );
  if (!held) throw new AppError('One or more selected seats were just taken. Please pick different seats.', 409);

  let booking;
  try {
    const holdMinutes = Number(process.env.SEAT_HOLD_MINUTES) || 10;
    booking = await Booking.create({
      user: req.user._id,
      show: show._id,
      movie: show.movie,
      theatre: show.theatre,
      seats: seatDetails,
      totalAmount,
      expiresAt: new Date(Date.now() + holdMinutes * 60000),
    });
  } catch (err) {
    await Show.updateOne({ _id: show._id }, { $pull: { bookedSeats: { $in: seatIds } } }); // roll back
    throw err;
  }

  res.status(201).json({
    success: true,
    message: `Seats held. Complete payment before ${booking.expiresAt.toISOString()}`,
    booking,
  });
});

// POST /api/bookings/:id/pay   body: { method: "card|upi|netbanking|wallet", details: {...} }
exports.payForBooking = asyncHandler(async (req, res) => {
  const { method, details } = req.body;
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.status === 'confirmed') throw new AppError('This booking is already paid', 400);
  if (booking.status !== 'pending' || booking.expiresAt < new Date()) {
    await releaseExpiredHolds(booking.show);
    throw new AppError('Seat hold expired. Please select seats again.', 410);
  }

  const result = await processPayment({ method, amount: booking.totalAmount, details });
  if (!result.success) {
    booking.payment = { method: booking.payment.method, status: 'failed' };
    await booking.save();
    throw new AppError(result.message, 402);
  }

  // atomic confirm: only if still pending and not expired
  const confirmed = await Booking.findOneAndUpdate(
    { _id: booking._id, status: 'pending', expiresAt: { $gt: new Date() } },
    {
      status: 'confirmed',
      $unset: { expiresAt: 1 },
      payment: { method, status: 'paid', transactionId: result.transactionId, paidAt: new Date() },
    },
    { new: true }
  );
  if (!confirmed) throw new AppError('Seat hold expired while paying. Any amount charged will be refunded.', 410);

  const [full, show, theatre] = await Promise.all([
    populateBooking(Booking.findById(confirmed._id)),
    Show.findById(confirmed.show),
    Theatre.findById(confirmed.theatre),
  ]);
  sendEmail(bookingConfirmationEmail(req.user, confirmed, show, full.movie, theatre));

  res.json({ success: true, message: 'Payment successful. Booking confirmed!', booking: full });
});

// GET /api/bookings/my  - booking history
exports.getMyBookings = asyncHandler(async (req, res) => {
  await releaseExpiredHolds();
  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const bookings = await populateBooking(Booking.find(filter).sort({ createdAt: -1 }));
  res.json({ success: true, count: bookings.length, bookings });
});

// GET /api/bookings/:id  (owner or admin)
exports.getBooking = asyncHandler(async (req, res) => {
  const booking = await populateBooking(Booking.findById(req.params.id)).populate('user', 'name email phone');
  if (!booking) throw new AppError('Booking not found', 404);
  const ownerId = booking.user._id ? String(booking.user._id) : String(booking.user);
  if (req.role !== 'admin' && ownerId !== String(req.user._id)) throw new AppError('Not allowed to view this booking', 403);
  res.json({ success: true, booking });
});

// PUT /api/bookings/:id/cancel  (owner or admin) - users can cancel until 2 hours before the show
exports.cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('user', 'name email').populate('movie', 'title');
  if (!booking) throw new AppError('Booking not found', 404);
  if (req.role !== 'admin' && String(booking.user._id) !== String(req.user._id)) {
    throw new AppError('Not allowed to cancel this booking', 403);
  }
  if (!['pending', 'confirmed'].includes(booking.status)) throw new AppError(`Booking is already ${booking.status}`, 400);

  const show = await Show.findById(booking.show);
  if (req.role !== 'admin' && show && show.startTime.getTime() - Date.now() < 2 * 3600 * 1000) {
    throw new AppError('Bookings can only be cancelled up to 2 hours before the show', 400);
  }

  const wasPaid = booking.payment.status === 'paid';
  booking.status = 'cancelled';
  if (wasPaid) booking.payment.status = 'refunded'; // simulated refund
  await booking.save();

  await Show.updateOne({ _id: booking.show }, { $pull: { bookedSeats: { $in: booking.seats.map((s) => s.seatId) } } });

  sendEmail(bookingCancelledEmail(booking.user, booking, booking.movie));
  res.json({ success: true, message: wasPaid ? 'Booking cancelled. Refund initiated.' : 'Booking cancelled.', booking });
});
