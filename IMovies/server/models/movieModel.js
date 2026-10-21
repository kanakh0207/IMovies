const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, trim: true },
    genre: { type: [String], required: [true, 'At least one genre is required'] },
    language: { type: String, required: [true, 'Language is required'], trim: true },
    duration: { type: Number, required: [true, 'Duration (minutes) is required'], min: 1 },
    certificate: { type: String, enum: ['U', 'UA', 'A', 'S'], default: 'UA' },
    director: { type: String, trim: true },
    cast: [{ name: { type: String, required: true }, role: String }],
    releaseDate: { type: Date, required: [true, 'Release date is required'] },
    poster: { type: String },
    trailerUrl: { type: String },
    // calculated from reviews
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// now_showing / upcoming is derived from the release date
movieSchema.virtual('status').get(function () {
  return this.releaseDate && this.releaseDate > new Date() ? 'upcoming' : 'now_showing';
});

movieSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Movie', movieSchema);
