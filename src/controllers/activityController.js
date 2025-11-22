const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

// these controller files will all have comments before each function describing its purpose, route, and access level because its standard practice

// @desc    Get current user's activity logs
// @route   GET /api/activities/me
// @access  Private
exports.getMyActivities = async (req, res, next) => {
  try {
    const { limit = 50, action } = req.query;

    // build the query
    let query = { userId: req.user.id };
    
    if (action) {
      query.action = action;
    }

    const activities = await ActivityLog.find(query)
      .populate('gameId', 'title platform')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activity logs for a specific user
// @route   GET /api/activities/user/:userId
// @access  Private
exports.getUserActivities = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 50, action } = req.query;

    // buold query
    let query = { userId };
    
    if (action) {
      query.action = action;
    }

    const activities = await ActivityLog.find(query)
      .populate('userId', 'username')
      .populate('gameId', 'title platform')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activity logs for a specific game
// @route   GET /api/activities/game/:gameId
// @access  Private
exports.getGameActivities = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { limit = 50, action } = req.query;

    // Build query
    let query = { gameId };
    
    if (action) {
      query.action = action;
    }

    const activities = await ActivityLog.find(query)
      .populate('userId', 'username country')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all activities (Admin only)
// @route   GET /api/activities
// @access  Private/Admin
exports.getAllActivities = async (req, res, next) => {
  try {
    const { limit = 100, action } = req.query;

    let query = {};
    
    if (action) {
      query.action = action;
    }

    const activities = await ActivityLog.find(query)
      .populate('userId', 'username')
      .populate('gameId', 'title platform')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activity statistics for current user
// @route   GET /api/activities/me/stats
// @access  Private
exports.getMyActivityStats = async (req, res, next) => {
  try {
    // converting string to objectID 
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    
    const stats = await ActivityLog.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // get number of acitivities
    const totalActivities = await ActivityLog.countDocuments({ userId: req.user.id });

    // Get recent activity
    const recentActivity = await ActivityLog.findOne({ userId: req.user.id })
      .populate('gameId', 'title platform')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      data: {
        totalActivities,
        breakdown: stats,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete activity log (Admin only)
// @route   DELETE /api/activities/:id
// @access  Private/Admin
exports.deleteActivity = async (req, res, next) => {
  try {
    const activity = await ActivityLog.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found',
      });
    }

    await activity.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Activity log deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};