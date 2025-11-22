const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Game title is required'],
    trim: true,
  },
  platform: {
    type: String,
    required: [true, 'Platform is required'],
    enum: ['PS4', 'PS5'],
  },
  genres: {
    type: [String],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length > 0;
      },
      message: 'At least one genre is required',
    },
  },
  releaseDate: {
    type: Date,
    required: [true, 'Release date is required'],
  },
  publisher: {
    type: String,
    required: [true, 'Publisher is required'],
  },
  avgRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0,
  },
});

// Text index for searching game titles
gameSchema.index({ title: 'text' });

module.exports = mongoose.model('Game', gameSchema);