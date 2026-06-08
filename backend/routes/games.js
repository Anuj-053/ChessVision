const express = require('express');
const { saveGame, getGames, getStats, getGame, deleteGame, updateGame } = require('../controllers/gameController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.post('/',         saveGame);
router.get('/',          getGames);
router.get('/stats',     getStats);
router.get('/:id',       getGame);
router.patch('/:id',     updateGame);
router.delete('/:id',    deleteGame);

module.exports = router;
