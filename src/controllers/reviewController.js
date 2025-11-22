const Review = require('../models/Review');
const Game = require('../models/Game');
const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    const { gameId, rating, title, body } = req.body;

    // check for existing game
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    // check for existing review by this user
    const existingReview = await Review.findOne({
      userId: req.user.id,
      gameId: gameId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this game. Please update your existing review instead.',
      });
    }

    // start transaction for concurrency
    session.startTransaction();

    // create the review
    const review = await Review.create([{
      userId: req.user.id,
      gameId,
      rating,
      title,
      body,
    }], { session });

    // log it for backup and safety
    await ActivityLog.create([{
      userId: req.user.id,
      gameId,
      action: 'review_submitted',
      meta: { rating, reviewId: review[0]._id },
    }], { session });

    // recalculate the game rating based on this new review
    await Review.recalculateGameRating(gameId, session);

    await session.commitTransaction();

    // populate user and game info
    const populatedReview = await Review.findById(review[0]._id)
      .populate('userId', 'username country')
      .populate('gameId', 'title platform');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: populatedReview,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Get all reviews for a specific game
// @route   GET /api/reviews/game/:gameId
// @access  Public
exports.getGameReviews = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { sort } = req.query;

    // check for existing game
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    // build sort option
    let sortOption = { createdAt: -1 }; // sort by newest by default
    if (sort === 'rating_high') {
      sortOption = { rating: -1 };
    } else if (sort === 'rating_low') {
      sortOption = { rating: 1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    const reviews = await Review.find({ gameId })
      .populate('userId', 'username country')
      .sort(sortOption);

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews by a specific user
// @route   GET /api/reviews/user/:userId
// @access  Public
exports.getUserReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ userId })
      .populate('gameId', 'title platform avgRating')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's reviews
// @route   GET /api/reviews/me
// @access  Private
exports.getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ userId: req.user.id })
      .populate('gameId', 'title platform avgRating')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single review by ID
// @route   GET /api/reviews/:id
// @access  Public
exports.getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('userId', 'username country')
      .populate('gameId', 'title platform');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (Own reviews only)
exports.updateReview = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    const { rating, title, body } = req.body;

    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // check if the review belongs to the user
    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this review',
      });
    }

    // start transaction for concurrency
    session.startTransaction();

    // update the review
    review = await Review.findByIdAndUpdate(
      req.params.id,
      { rating, title, body },
      { new: true, runValidators: true, session }
    ).populate('userId', 'username country')
     .populate('gameId', 'title platform');

    // log the activity for backup and safety
    await ActivityLog.create([{
      userId: req.user.id,
      gameId: review.gameId._id,
      action: 'review_updated',
      meta: { rating, reviewId: review._id },
    }], { session });

    // recalculate the overall game rating from this updated review
    await Review.recalculateGameRating(review.gameId._id, session);

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (Own reviews or Admin)
exports.deleteReview = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // check if user owns this review or is an admin
    if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this review',
      });
    }

    // store the gameId before deletion
    const gameId = review.gameId;

    // Start transaction for concurrency
    session.startTransaction();

    // delete the review
    await review.deleteOne({ session });

    // log the activity for backup and safety
    await ActivityLog.create([{
      userId: req.user.id,
      gameId: gameId,
      action: 'review_deleted',
      meta: { reviewId: review._id },
    }], { session });

    // Recalculate game rating because a review was deleted
    await Review.recalculateGameRating(gameId, session);

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
      data: {},
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    next(error);
  } finally {
    session.endSession();
  }
};