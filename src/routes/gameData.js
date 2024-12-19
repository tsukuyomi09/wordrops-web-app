const express = require('express');
const router = express.Router();
const { activeGames } = require('../services/gameManager');
const checkAuth = require('../middlewares/checkAuthToken');

router.get('/game-data/:gameId', checkAuth, (req, res) => {
    console.log("recupero data per il game in corso..")
    console.log("Contenuto di activeGames:", JSON.stringify([...activeGames.entries()], null, 2));

    const { gameId } = req.params;
    const numericGameId = Number(gameId);
    const game = activeGames.get(numericGameId);
    console.log("Dati del gioco trovato:", JSON.stringify(game, null, 2));

    if (!game) {
        return res.status(404).json({ error: 'Gioco non trovato' });
    }

    const { players, turnOrder, turnIndex } = game;
    const currentPlayer = players.find(player => player.id === turnOrder[turnIndex].id);

    console.log("Indice turno corrente:", turnIndex);
    console.log("Giocatore corrente da turnOrder:", turnOrder[turnIndex]);


    if (!currentPlayer) {
        return res.status(500).json({ error: 'Errore nella determinazione del giocatore attuale' });
    }

    res.status(200).json({
        players,
        turnOrder,
        currentPlayer
    });
});

module.exports = router;
