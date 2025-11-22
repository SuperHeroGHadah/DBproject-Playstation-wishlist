const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: [true, 'Game ID is required'],
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  body: {
    type: String,
    required: [true, 'Review body is required'],
    trim: true,
    maxlength: [1000, 'Review body cannot exceed 1000 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes from last progress report
reviewSchema.index({ gameId: 1 });
reviewSchema.index({ userId: 1, gameId: 1 }, { unique: true }); // Prevent duplicate reviews

// method to recalculate game rating
reviewSchema.statics.recalculateGameRating = async function(gameId, session = null) {
  const Game = mongoose.model('Game');
  
  const stats = await this.aggregate([
    { $match: { gameId: new mongoose.Types.ObjectId(gameId) } },
    {
      $group: {
        _id: '$gameId',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]).session(session);

  if (stats.length > 0) {
    await Game.findByIdAndUpdate(
      gameId,
      {
        avgRating: parseFloat(stats[0].avgRating.toFixed(1)),
        totalReviews: stats[0].totalReviews,
      },
      { session }
    );
  } else {
    // no reviews left
    await Game.findByIdAndUpdate(
      gameId,
      { avgRating: 0, totalReviews: 0 },
      { session }
    );
  }
};

module.exports = mongoose.model('Review', reviewSchema);