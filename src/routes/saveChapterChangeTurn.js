const express = require('express');
const router = express.Router();
const { activeGames } = require('../services/gameManager');
const checkAuth = require('../middlewares/checkAuthToken');
const startCountdown = require('../services/gameManager');

router.post('/saveChapterChangeTurn/:gameId', checkAuth, (req, res) => {
    const { gameId } = req.params;
    const { title, content, currentUser } = req.body; // Dati inviati dal client
    const username = req.username; // Dati dal middleware

    if (username !== currentUser) {
        res.status(403).json({ message: "Utente non autorizzato." });
        return;
    }

    const game = activeGames.get(Number(gameId));

    if (!game) {
        res.status(404).json({ message: "Partita non trovata." });
        return;
    }

    const turnIndex = game.turnIndex;
    const currentTurnPlayer = game.turnOrder[turnIndex];

    if (!currentTurnPlayer) {
        res.status(500).json({ message: "Errore nel recupero del turno corrente." });
        return;
    }

    if (currentTurnPlayer.username !== currentUser) {
        res.status(403).json({ message: "Non è il turno di questo giocatore." });
        return;
    }

    const newChapter = { title, content, author: username };

    game.chapters.push({ title, content, author: username });
    game.turnIndex = (turnIndex + 1) % game.turnOrder.length;

    req.io.to(Number(gameId)).emit('nextChapterUpdate', {
        chapter: newChapter, // Capitolo appena aggiunto
        nextPlayer: game.turnOrder[game.turnIndex].username, // Prossimo giocatore
    });

    res.json({ message: "Dati ricevuti correttamente." });
})


module.exports = router;
