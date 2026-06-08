const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  moveNumber: Number,
  move: String,
  fen: String,
  evaluation: Number,
  bestMove: String,
  classification: {
    type: String,
    enum: ['brilliant', 'good', 'inaccuracy', 'mistake', 'blunder', 'book'],
  },
}, { _id: false });

const gameSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  pgn: { type: String, default: '' },
  fen: { type: String, default: '' },
  mode: {
    type: String,
    enum: ['analyzer', 'play', 'blindfold', 'notation'],
    required: true,
  },
  result: {
    type: String,
    enum: ['win', 'loss', 'draw', 'incomplete', 'white_win', 'black_win'],
    default: 'incomplete',
  },
  playerColor: {
    type: String,
    enum: ['white', 'black'],
    default: 'white',
  },
  opponentLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'master'],
    default: 'intermediate',
  },
  opening: { type: String, default: 'Unknown Opening' },
  moveCount: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  analysis: [analysisSchema],
  playedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);
