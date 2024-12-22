const express = require('express');
const router = express.Router();
const { activeGames, startCountdown } = require('../services/gameManager');
const checkAuth = require('../middlewares/checkAuthToken');

router.post('/saveChapterChangeTurn/:gameId', checkAuth, (req, res) => {
    const { gameId } = req.params;
    const user_id = req.user_id
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

    const newChapter = { title, content, author: username, user_id: user_id };

    game.chapters.push({ title, content, author: username, user_id: user_id });

    game.turnIndex = (turnIndex + 1) % game.turnOrder.length;
    startCountdown(Number(gameId));

    const nextPlayer = game.turnOrder[game.turnIndex];

    const logGameData = {
        gameId: game.gameId,
        players: game.players,
        chapters: game.chapters,
        status: game.status,
        turnOrder: game.turnOrder,
        readyPlayersCount: game.readyPlayersCount,
        turnIndex: game.turnIndex,
        connections: game.connections,
        startedAt: game.startedAt
    };
    
    // Log senza la struttura circolare
    console.log("/////////////////////////")
    console.log("/////////////////////////")
    console.log("")
    console.log("Informazioni semplificate del gioco:", JSON.stringify(logGameData, null, 2));
    console.log("")
    console.log("/////////////////////////")
    console.log("/////////////////////////")

// Verifica che i dati siano corretti prima di inviarli
    console.log("Dati del prossimo giocatore:", nextPlayer);

    req.io.to(Number(gameId)).emit('nextChapterUpdate', {
        chapter: newChapter, // Capitolo appena aggiunto
        nextPlayer: game.turnOrder[game.turnIndex], // Prossimo giocatore (intero oggetto)
    });


    res.json({ message: "Dati ricevuti correttamente." });
})


module.exports = router;
