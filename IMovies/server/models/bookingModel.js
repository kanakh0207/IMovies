const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },
    seats: [
      {
        _id: false,
        seatId: String,
        type: { type: String },
        price: Number,
      },
    ],
    totalAmount: { type: Number, required: true },
    // pending = seats held awaiting payment
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'expired'], default: 'pending' },
    expiresAt: { type: Date },
    payment: {
      method: { type: String, enum: ['card', 'upi', 'netbanking', 'wallet'] },
      status: { type: String, enum: ['unpaid', 'paid', 'failed', 'refunded'], default: 'unpaid' },
      transactionId: String,
      paidAt: Date,
    },
  },
  { timestamps: true }
);

bookingSchema.pre('validate', function (next) {
  if (!this.bookingCode) {
    this.bookingCode = 'IM' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
