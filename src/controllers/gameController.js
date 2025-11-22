const Game = require('../models/Game');

// @desc    Get all games
// @route   GET /api/games
// @access  Public
exports.getAllGames = async (req, res, next) => {
  try {
    const { platform, genre, sort } = req.query;
    
    // builf query
    let query = {};
    
    if (platform) {
      query.platform = platform;
    }
    
    if (genre) {
      query.genres = { $in: [genre] };
    }

    // build the sort
    let sortOption = {};
    if (sort === 'rating') {
      sortOption = { avgRating: -1 };
    } else if (sort === 'newest') {
      sortOption = { releaseDate: -1 };
    } else if (sort === 'oldest') {
      sortOption = { releaseDate: 1 };
    } else {
      sortOption = { title: 1 }; // thedefault sort is by alphabetical order
    }

    const games = await Game.find(query).sort(sortOption);

    res.status(200).json({
      success: true,
      count: games.length,
      data: games,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single game by ID
// @route   GET /api/games/:id
// @access  Public
exports.getGameById = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    res.status(200).json({
      success: true,
      data: game,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search games by title
// @route   GET /api/games/search
// @access  Public
exports.searchGames = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    // use the text search index
    const games = await Game.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });

    res.status(200).json({
      success: true,
      count: games.length,
      data: games,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new game
// @route   POST /api/games
// @access  Private/Admin
exports.createGame = async (req, res, next) => {
  try {
    const { title, platform, genres, releaseDate, publisher } = req.body;

    // check for existing game
    const existingGame = await Game.findOne({ title, platform });
    
    if (existingGame) {
      return res.status(400).json({
        success: false,
        message: 'Game with this title and platform already exists',
      });
    }

    const game = await Game.create({
      title,
      platform,
      genres,
      releaseDate,
      publisher,
      avgRating: 0,
      totalReviews: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      data: game,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update game
// @route   PUT /api/games/:id
// @access  Private/Admin
exports.updateGame = async (req, res, next) => {
  try {
    const { title, platform, genres, releaseDate, publisher } = req.body;

    let game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    // do the update
    game = await Game.findByIdAndUpdate(
      req.params.id,
      { title, platform, genres, releaseDate, publisher },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Game updated successfully',
      data: game,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete game
// @route   DELETE /api/games/:id
// @access  Private/Admin
exports.deleteGame = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    await game.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Game deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get games by platform
// @route   GET /api/games/platform/:platform
// @access  Public
exports.getGamesByPlatform = async (req, res, next) => {
  try {
    const { platform } = req.params;

    if (!['PS4', 'PS5'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be PS4 or PS5',
      });
    }

    const games = await Game.find({ platform }).sort({ avgRating: -1 });

    res.status(200).json({
      success: true,
      count: games.length,
      data: games,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top rated games
// @route   GET /api/games/top-rated
// @access  Public
exports.getTopRatedGames = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const games = await Game.find()
      .sort({ avgRating: -1, totalReviews: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: games.length,
      data: games,
    });
  } catch (error) {
    next(error);
  }
};