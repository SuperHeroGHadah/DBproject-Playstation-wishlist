const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getMyGameList,
  addToWishlist,
  removeFromWishlist,
  markAsPlayed,
  removeFromPlayed,
  getMyWishlist,
  getMyPlayedGames,
} = require('../controllers/userGameListController');

const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateMyProfile,
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validator');

// admin only routes
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

// user only routes
router.use(protect);

// user profile routes
router.put('/me/profile', updateMyProfile);

// game list routes
router.get('/me/gamelist', getMyGameList);
router.get('/me/wishlist', getMyWishlist);
router.get('/me/played', getMyPlayedGames);

// wishlist
router.post(
  '/me/wishlist',
  [
    body('gameId').isMongoId().withMessage('Invalid game ID'),
  ],
  handleValidationErrors,
  addToWishlist
);

router.delete('/me/wishlist/:gameId', removeFromWishlist);

// played list
router.post(
  '/me/played',
  [
    body('gameId').isMongoId().withMessage('Invalid game ID'),
    body('completionHours').optional().isInt({ min: 0 }).withMessage('Completion hours must be a positive number'),
  ],
  handleValidationErrors,
  markAsPlayed
);

router.delete('/me/played/:gameId', removeFromPlayed); //removing from played list

module.exports = router;