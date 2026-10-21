const Booking = require('../models/bookingModel');
const Show = require('../models/showModel');

// Builds a map of every seat in a screen: { A1: { seatId, row, number, type }, ... }
const buildSeatLookup = (screen) => {
  const lookup = {};
  screen.layout.forEach(({ row, seats, type }) => {
    for (let n = 1; n <= seats; n++) {
      lookup[`${row}${n}`] = { seatId: `${row}${n}`, row, number: n, type };
    }
  });
  return lookup;
};

// Seat map for the UI, grouped by row, with availability and price
const buildSeatMap = (screen, show) => {
  const booked = new Set(show.bookedSeats);
  return screen.layout.map(({ row, seats, type }) => ({
    row,
    type,
    price: show.prices[type],
    seats: Array.from({ length: seats }, (_, i) => {
      const seatId = `${row}${i + 1}`;
      return { seatId, number: i + 1, status: booked.has(seatId) ? 'booked' : 'available' };
    }),
  }));
};

// Frees seats held by pending bookings whose payment window has expired
const releaseExpiredHolds = async (showId) => {
  const filter = { status: 'pending', expiresAt: { $lt: new Date() } };
  if (showId) filter.show = showId;
  const stale = await Booking.find(filter);

  for (const b of stale) {
    // atomic status flip so two requests can't release the same seats twice
    const flipped = await Booking.findOneAndUpdate({ _id: b._id, status: 'pending' }, { status: 'expired' });
    if (flipped) {
      await Show.updateOne({ _id: b.show }, { $pull: { bookedSeats: { $in: b.seats.map((s) => s.seatId) } } });
    }
  }
};

module.exports = { buildSeatLookup, buildSeatMap, releaseExpiredHolds };
