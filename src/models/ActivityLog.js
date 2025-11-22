const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
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
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: ['added_to_wishlist', 'removed_from_wishlist', 'marked_as_played', 'review_submitted', 'review_updated', 'review_deleted'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

// Indexes 
activityLogSchema.index({ userId: 1, timestamp: -1 }); // added for user activity queries
activityLogSchema.index({ gameId: 1, timestamp: -1 }); // Added for game activity queries
activityLogSchema.index({ action: 1, timestamp: -1 }); // Added for action-specific queries

module.exports = mongoose.model('ActivityLog', activityLogSchema);