const mongoose = require('mongoose');

// "favourite" = liked movie, "watchlist" = want to watch (e.g. upcoming releases)
const favouriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    type: { type: String, enum: ['favourite', 'watchlist'], default: 'favourite' },
  },
  { timestamps: true }
);

favouriteSchema.index({ user: 1, movie: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Favourite', favouriteSchema);
