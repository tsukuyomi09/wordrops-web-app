const express = require('express');
const router = express.Router();
const { activeGames } = require('../services/gameManager');
const { resetUserStatus, deleteGameFromDB } = require('../database/db');  // Supponiamo di avere queste funzioni

router.post('/abandon-game/:gameId', async (req, res) => {
    const { gameId } = req.params;

    // Recupera il gioco dalla Map
    const game = activeGames.get(Number(gameId));
    if (!game) {
        return res.status(404).json({ message: 'Gioco non trovato.' });
    }

    // Ottieni i giocatori prima di eliminare il gioco
    const players = game.players;

    // Rimuovi il gioco dalla Map
    activeGames.delete(Number(gameId));

    // Resetta gli utenti e cancella dal DB
    try {
        await deleteGameFromDB(Number(gameId)); // Cancella dal DB
        await resetUserStatus(players); // Resetta gli utenti a 'idle'
    } catch (err) {
        console.error("Errore durante l'aggiornamento del database:", err);
        return res.status(500).json({ message: 'Errore durante la cancellazione.' });
    }

    // Notifica i giocatori tramite socket
    req.io.to(Number(gameId)).emit('gameAbandoned', { message: 'La partita purtroppo è stata abbandonata da un giocatore.' });

    res.json({ message: 'Gioco abbandonato e giocatori notificati.' });
});


module.exports = router;