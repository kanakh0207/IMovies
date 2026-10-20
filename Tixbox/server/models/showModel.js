const mongoose = require('mongoose');

const showSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },
    screenId: { type: mongoose.Schema.Types.ObjectId, required: true },
    screenName: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    // price per seat type
    prices: {
      Regular: { type: Number, default: 150 },
      Premium: { type: Number, default: 250 },
      Recliner: { type: Number, default: 400 },
    },
    // seat ids such as "A1" that are held (pending payment) or sold
    bookedSeats: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

showSchema.index({ movie: 1, startTime: 1 });
showSchema.index({ theatre: 1, screenId: 1, startTime: 1 });

module.exports = mongoose.model('Show', showSchema);
