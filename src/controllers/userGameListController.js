const UserGameList = require('../models/UserGameList');
const Game = require('../models/Game');
const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

// @desc    Get current user's game list (wishlist + played)
// @route   GET /api/users/me/gamelist
// @access  Private
exports.getMyGameList = async (req, res, next) => {
  try {
    let gameList = await UserGameList.findOne({ userId: req.user.id })
      .populate('wishlist.gameId', 'title platform genres avgRating')
      .populate('played.gameId', 'title platform genres avgRating');

    // make a gamelis incase the user doesnt have one already
    if (!gameList) {
      gameList = await UserGameList.create({
        userId: req.user.id,
        wishlist: [],
        played: [],
      });
    }

    res.status(200).json({
      success: true,
      data: gameList,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add game to wishlist
// @route   POST /api/users/me/wishlist
// @access  Private
exports.addToWishlist = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    const { gameId } = req.body;

    // check if the game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    // Start transaction for concurrency
    session.startTransaction();

    // either find the gamelist or againc reate a new one just incase they dont have one
    let gameList = await UserGameList.findOne({ userId: req.user.id }).session(session);

    if (!gameList) {
      gameList = await UserGameList.create([{
        userId: req.user.id,
        wishlist: [],
        played: [],
      }], { session });
      gameList = gameList[0];
    }

    // check if game is already in wishlist
    const alreadyInWishlist = gameList.wishlist.some(
      item => item.gameId.toString() === gameId
    );

    if (alreadyInWishlist) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Game is already in your wishlist',
      });
    }

    // check if game is in played list
    const alreadyPlayed = gameList.played.some(
      item => item.gameId.toString() === gameId
    );

    if (alreadyPlayed) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Game is already in your played list. Cannot add to wishlist.',
      });
    }

    // add to wishlist using atomic $push for concurrency control
    gameList = await UserGameList.findOneAndUpdate(
      { userId: req.user.id },
      {
        $push: {
          wishlist: {
            gameId: gameId,
            addedAt: new Date(),
          },
        },
      },
      { new: true, session }
    ).populate('wishlist.gameId', 'title platform genres avgRating');

    // Log activity for backup and safety
    await ActivityLog.create([{
      userId: req.user.id,
      gameId: gameId,
      action: 'added_to_wishlist',
      meta: { source: 'web' },
    }], { session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Game added to wishlist successfully',
      data: gameList,
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

// @desc    Remove game from wishlist
// @route   DELETE /api/users/me/wishlist/:gameId
// @access  Private
exports.removeFromWishlist = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    const { gameId } = req.params;

    // Start transaction for concurrency
    session.startTransaction();

    const gameList = await UserGameList.findOne({ userId: req.user.id }).session(session);

    if (!gameList) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Game list not found',
      });
    }

    // check if game exists in wishlist
    const gameInWishlist = gameList.wishlist.some(
      item => item.gameId.toString() === gameId
    );

    if (!gameInWishlist) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Game not found in wishlist',
      });
    }

    // Remove from wishlist using atomic $pull for concurrency control
    const updatedList = await UserGameList.findOneAndUpdate(
      { userId: req.user.id },
      {
        $pull: {
          wishlist: { gameId: gameId },
        },
      },
      { new: true, session }
    ).populate('wishlist.gameId', 'title platform genres avgRating');

    // Log activity for backup and safety
    await ActivityLog.create([{
      userId: req.user.id,
      gameId: gameId,
      action: 'removed_from_wishlist',
      meta: {},
    }], { session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Game removed from wishlist successfully',
      data: updatedList,
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

// @desc    Mark game as played
// @route   POST /api/users/me/played
// @access  Private
exports.markAsPlayed = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    const { gameId } = req.body;

    // check if the game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    // Start transaction f or concurrency
    session.startTransaction();

    // either find the gamelist or create a new one just incase they dont have one
    let gameList = await UserGameList.findOne({ userId: req.user.id }).session(session);

    if (!gameList) {
      gameList = await UserGameList.create([{
        userId: req.user.id,
        wishlist: [],
        played: [],
      }], { session });
      gameList = gameList[0];
    }

    // check if game is already in played list
    const alreadyPlayed = gameList.played.some(
      item => item.gameId.toString() === gameId
    );

    if (alreadyPlayed) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Game is already in your played list',
      });
    }

    // Remove from wishlist if it exists there using atomic $pull
    await UserGameList.updateOne(
      { userId: req.user.id },
      { $pull: { wishlist: { gameId: gameId } } },
      { session }
    );

    // Add to played list using atomic $push for concurrency control
    gameList = await UserGameList.findOneAndUpdate(
      { userId: req.user.id },
      {
        $push: {
          played: {
            gameId: gameId,
            completedAt: new Date(),
          },
        },
      },
      { new: true, session }
    ).populate('played.gameId', 'title platform genres avgRating');

    // Log activity for backup and safety
    await ActivityLog.create([{
      userId: req.user.id,
      gameId: gameId,
      action: 'marked_as_played',
      meta: { completionHours: req.body.completionHours || null },
    }], { session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Game marked as played successfully',
      data: gameList,
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

// @desc    Remove game from played list
// @route   DELETE /api/users/me/played/:gameId
// @access  Private
exports.removeFromPlayed = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    const { gameId } = req.params;

    // Start transaction for concurrency
    session.startTransaction();

    const gameList = await UserGameList.findOne({ userId: req.user.id }).session(session);

    if (!gameList) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Game list not found',
      });
    }

    // check if game exists in played list
    const gameInPlayed = gameList.played.some(
      item => item.gameId.toString() === gameId
    );

    if (!gameInPlayed) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Game not found in played list',
      });
    }

    // Remove from played list using atomic $pull for concurrency control
    const updatedList = await UserGameList.findOneAndUpdate(
      { userId: req.user.id },
      {
        $pull: {
          played: { gameId: gameId },
        },
      },
      { new: true, session }
    ).populate('played.gameId', 'title platform genres avgRating');

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Game removed from played list successfully',
      data: updatedList,
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

// @desc    Get user's wishlist only
// @route   GET /api/users/me/wishlist
// @access  Private
exports.getMyWishlist = async (req, res, next) => {
  try {
    const gameList = await UserGameList.findOne({ userId: req.user.id })
      .populate('wishlist.gameId', 'title platform genres avgRating');

    if (!gameList) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      count: gameList.wishlist.length,
      data: gameList.wishlist,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's played games only
// @route   GET /api/users/me/played
// @access  Private
exports.getMyPlayedGames = async (req, res, next) => {
  try {
    const gameList = await UserGameList.findOne({ userId: req.user.id })
      .populate('played.gameId', 'title platform genres avgRating');

    if (!gameList) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      count: gameList.played.length,
      data: gameList.played,
    });
  } catch (error) {
    next(error);
  }
};