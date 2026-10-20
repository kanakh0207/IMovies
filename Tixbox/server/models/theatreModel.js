const mongoose = require('mongoose');

// A screen's seat layout is a list of rows, e.g. { row: 'A', seats: 10, type: 'Regular' }
const rowSchema = new mongoose.Schema(
  {
    row: { type: String, required: true, uppercase: true, trim: true },
    seats: { type: Number, required: true, min: 1, max: 40 },
    type: { type: String, enum: ['Regular', 'Premium', 'Recliner'], default: 'Regular' },
  },
  { _id: false }
);

const screenSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  layout: {
    type: [rowSchema],
    validate: [(v) => v.length > 0, 'A screen needs at least one row'],
  },
});

const theatreSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Theatre name is required'], trim: true },
    city: { type: String, required: [true, 'City is required'], trim: true },
    address: { type: String, trim: true },
    screens: { type: [screenSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Theatre', theatreSchema);
