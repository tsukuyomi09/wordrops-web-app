const express = require('express');
const router = express.Router();
const { activeGames, startCountdown } = require('../services/gameManager');

router.post('/game/:gameId/player-ready', async (req, res) => {
    const { gameId } = req.params;
    const game = activeGames.get(Number(gameId));
  
    if (!game) {
      return res.status(404).json({ error: 'Gioco non trovato' });
    }
  
    // Incrementa il contatore dei giocatori pronti
    game.readyPlayersCount = (game.readyPlayersCount || 0) + 1;
  
    // Se il numero di giocatori pronti raggiunge 5, inizia il gioco
    if (game.readyPlayersCount === 5) {
      game.status = 'in-progress'; // Imposta lo stato del gioco come "in-progress"
      startCountdown(gameId); // Avvia il countdown
      return res.json({ status: 'game-started' });
    }
  
    // Altrimenti, rimanda una risposta positiva che il giocatore è stato segnato come pronto
    res.json({ status: 'ready' });
  });

  module.exports = router;
