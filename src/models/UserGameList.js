const mongoose = require('mongoose');

const userGameListSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true, // only one list per user
  },
  wishlist: [
    {
      gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game',
        required: true,
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  played: [
    {
      gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game',
        required: true,
      },
      completedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

// Indexes from last progress report
userGameListSchema.index({ userId: 1 }, { unique: true });
userGameListSchema.index({ 'wishlist.gameId': 1 }); 
userGameListSchema.index({ 'played.gameId': 1 }); 

module.exports = mongoose.model('UserGameList', userGameListSchema);