const express = require('express');
const router = express.Router();
const {
  createReview,
  getGameReviews,
  getUserReviews,
  getMyReviews,
  getReviewById,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { validateReview, validateObjectId, handleValidationErrors } = require('../middleware/validator');

// no need for auth
router.get('/game/:gameId', getGameReviews);
router.get('/user/:userId', getUserReviews);

// auth needed routes
router.use(protect);
router.get('/me', getMyReviews);

// This must come AFTER /me to prevent "me" being treated as an :id
router.get('/:id', validateObjectId, handleValidationErrors, getReviewById);
router.post('/', validateReview, handleValidationErrors, createReview);
router.put('/:id', validateObjectId, handleValidationErrors, updateReview);
router.delete('/:id', validateObjectId, handleValidationErrors, deleteReview);

module.exports = router;
