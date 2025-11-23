const express = require('express');
const router = express.Router();
const {
  getAllGames,
  getGameById,
  searchGames,
  createGame,
  updateGame,
  deleteGame,
  getGamesByPlatform,
  getTopRatedGames,
} = require('../controllers/gameController');
const { protect, authorize } = require('../middleware/auth');
const { validateGame, validateObjectId, handleValidationErrors } = require('../middleware/validator');

// public routes(no need for any auth)
router.get('/', getAllGames);
router.get('/search', searchGames);
router.get('/top-rated', getTopRatedGames);
router.get('/platform/:platform', getGamesByPlatform);
router.get('/:id', validateObjectId, handleValidationErrors, getGameById);

// admin only routes
router.post('/', protect, authorize('admin'), validateGame, handleValidationErrors, createGame);
router.put('/:id', protect, authorize('admin'), validateObjectId, validateGame, handleValidationErrors, updateGame);
router.delete('/:id', protect, authorize('admin'), validateObjectId, handleValidationErrors, deleteGame);

module.exports = router;