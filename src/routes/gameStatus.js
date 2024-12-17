const express = require('express');
const router = express.Router();
const { activeGames } = require('../services/gameManager');


router.get('/game-status/:gameId', async (req, res) => {
    const { gameId } = req.params;
    const game = activeGames.get(Number(gameId)); // Ottieni il gioco dalla mappa
  
    if (game) {
      res.json({ status: game.status });
    } else {
      res.status(404).json({ error: 'Gioco non trovato' });
    }
  });

  module.exports = router;
