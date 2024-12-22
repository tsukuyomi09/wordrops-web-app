const express = require('express');
const router = express.Router();
const { activeGames, startCountdown } = require('../services/gameManager');

router.post('/game/:gameId/player-ready', async (req, res) => {
    const { gameId } = req.params;
    console.log(`Richiesta ricevuta per segnare il giocatore come pronto per il gioco ID: ${gameId}`);
  
    // Cerca il gioco nella mappa activeGames
    const game = activeGames.get(Number(gameId));
    if (!game) {
      console.log(`Gioco con ID ${gameId} non trovato.`);
      return res.status(404).json({ error: 'Gioco non trovato' });
    }

    console.log(`Gioco trovato:`, JSON.stringify(game, null, 2));

    // Incrementa il contatore dei giocatori pronti
    game.readyPlayersCount = (game.readyPlayersCount || 0) + 1;
    console.log(`Giocatori pronti: ${game.readyPlayersCount} / 5`);

    // Se il numero di giocatori pronti raggiunge 5, inizia il gioco
    if (game.readyPlayersCount === 5) {
      console.log('Cinque giocatori pronti, inizio del gioco...');
      game.status = 'in-progress'; // Imposta lo stato del gioco come "in-progress"
      startCountdown(gameId); // Avvia il countdown
      return res.json({ status: 'in-progress' });
    }

    // Altrimenti, rimanda una risposta positiva che il giocatore è stato segnato come pronto
    console.log('Giocatore segnato come pronto, ma il gioco non è ancora iniziato.');
    res.json({ status: 'ready' });
  });

module.exports = router;