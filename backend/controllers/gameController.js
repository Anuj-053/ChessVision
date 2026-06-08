const Game = require('../models/Game');

const saveGame = async (req, res) => {
  try {
    const { pgn, fen, mode, result, playerColor, opponentLevel, opening, moveCount, accuracy, duration, analysis } = req.body;
    const game = await Game.create({
      userId: req.user._id,
      pgn, fen, mode, result, playerColor, opponentLevel,
      opening:   opening   || 'Unknown Opening',
      moveCount: moveCount || 0,
      accuracy:  accuracy  || 0,
      duration:  duration  || 0,
      analysis:  analysis  || [],
    });
    res.status(201).json({ game });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save game', error: err.message });
  }
};

const getGames = async (req, res) => {
  try {
    const { page = 1, limit = 10, mode, result } = req.query;
    const filter = { userId: req.user._id };
    if (mode)   filter.mode   = mode;
    if (result) filter.result = result;

    const total = await Game.countDocuments(filter);
    const games = await Game.find(filter)
      .sort({ playedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-analysis');

    res.json({ games, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch games' });
  }
};

const getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Exclude analyzer-only games from stats and recent — those are reference material,
    // not competitive games, so they shouldn't affect win rate or totals.
    const gameFilter  = { userId, mode: { $ne: 'analyzer' } };

    const [stats] = await Game.aggregate([
      { $match: gameFilter },
      {
        $group: {
          _id:     null,
          total:   { $sum: 1 },
          wins:    { $sum: { $cond: [{ $eq: ['$result', 'win']  }, 1, 0] } },
          losses:  { $sum: { $cond: [{ $eq: ['$result', 'loss'] }, 1, 0] } },
          draws:   { $sum: { $cond: [{ $eq: ['$result', 'draw'] }, 1, 0] } },
        },
      },
    ]);

    const recent = await Game.find(gameFilter)
      .sort({ playedAt: -1 })
      .limit(5)
      .select('-analysis');

    res.json({
      stats:  stats || { total: 0, wins: 0, losses: 0, draws: 0 },
      recent,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

const getGame = async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, userId: req.user._id });
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json({ game });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch game' });
  }
};

const updateGame = async (req, res) => {
  try {
    const { analysis, accuracy, opening, moveCount, result } = req.body;
    const update = {};
    if (analysis  !== undefined) update.analysis  = analysis;
    if (accuracy  !== undefined) update.accuracy  = accuracy;
    if (opening   !== undefined) update.opening   = opening;
    if (moveCount !== undefined) update.moveCount = moveCount;
    if (result    !== undefined) update.result    = result;

    const game = await Game.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: update },
      { new: true }
    );
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json({ game });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update game', error: err.message });
  }
};

const deleteGame = async (req, res) => {
  try {
    const game = await Game.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json({ message: 'Game deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete game' });
  }
};

module.exports = { saveGame, getGames, getStats, getGame, updateGame, deleteGame };
