// src/routes/activities.js
const express = require('express');
const router = express.Router();
const {
  getMyActivities,
  getUserActivities,
  getGameActivities,
  getAllActivities,
  getMyActivityStats,
  deleteActivity,
} = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId, handleValidationErrors } = require('../middleware/validator');

// enforce auth for all routes
router.use(protect);

// user role routes
router.get('/me', getMyActivities);
router.get('/me/stats', getMyActivityStats);
router.get('/user/:userId', validateObjectId, handleValidationErrors, getUserActivities);

// related to games
router.get('/game/:gameId', validateObjectId, handleValidationErrors, getGameActivities);

// admin only routes
router.get('/', authorize('admin'), getAllActivities);
router.delete('/:id', authorize('admin'), validateObjectId, handleValidationErrors, deleteActivity);

module.exports = router;