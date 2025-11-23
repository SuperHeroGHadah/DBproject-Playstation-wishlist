const { body, param, validationResult } = require('express-validator');

// Middleware to handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// validate registration parameters
exports.validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),
];

// validate login parameters
exports.validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// validate review parameters
exports.validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .escape(), // Sanitize HTML
  body('body')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Review body must be between 10 and 1000 characters')
    .escape(), // Sanitize HTML
  body('gameId')
    .isMongoId()
    .withMessage('Invalid game ID'),
];

// validate game parameters (for admin use only)
exports.validateGame = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Game title is required')
    .escape(),
  body('platform')
    .isIn(['PS4', 'PS5'])
    .withMessage('Platform must be PS4 or PS5'),
  body('genres')
    .isArray({ min: 1 })
    .withMessage('At least one genre is required'),
  body('releaseDate')
    .isISO8601()
    .withMessage('Invalid release date format'),
  body('publisher')
    .trim()
    .notEmpty()
    .withMessage('Publisher is required')
    .escape(),
];

// ensures that the id will work with MongoDB
exports.validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
];