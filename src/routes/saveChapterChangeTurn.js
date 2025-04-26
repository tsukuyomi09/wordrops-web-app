const express = require("express");
const router = express.Router();
const { activeGames } = require("../services/gameManager");
const { startCountdown } = require("../services/gameCountdownStart");
const { saveGame } = require("../services/saveGame");
const { removeGameFromPlayers } = require("../utils/removeGameFromPlayers");
const checkAuth = require("../middlewares/checkAuthToken");

router.post("/saveChapterChangeTurn/:gameId", checkAuth, async (req, res) => {
    const user_id = req.user_id;
    const username = req.username;
    const { gameId } = req.params;
    const { title, content, currentUser } = req.body; // Dati inviati dal client

    console.log("== saveChapterChangeTurn ==");
    console.log("user_id:", user_id);
    console.log("username:", username);
    console.log("currentUser (from client):", currentUser);

    if (username !== currentUser) {
        console.log("❌ currentUser mismatch");
        res.status(403).json({ message: "Utente non autorizzato." });
        return;
    }

    const game = activeGames.get(gameId);
    if (!game) {
        console.log("❌ Partita non trovata con ID:", gameId);
        res.status(404).json({ message: "Partita non trovata." });
        return;
    }

    const turnIndex = game.turnIndex;
    const currentTurnPlayer = game.turnOrder[turnIndex];

    console.log("Game ID:", gameId);
    console.log("Turn Index:", turnIndex);
    console.log("Current Turn Player:", currentTurnPlayer);
    console.log("Full Turn Order:", game.turnOrder);

    if (!currentTurnPlayer) {
        console.log("❌ Nessun giocatore trovato al turno corrente");
        res.status(500).json({
            message: "Errore nel recupero del turno corrente.",
        });
        return;
    }

    if (currentTurnPlayer.username !== currentUser) {
        console.log("currentTurnPlayer mismatch");
        res.status(403).json({
            message: "Non è il turno di questo giocatore.",
        });
        return;
    }

    const newChapter = {
        title,
        content,
        author: username,
        user_id: user_id,
        isValid: true,
        timestamp: Date.now(), // o new Date().toISOString()
    };

    game.chapters.push(newChapter);

    if (game.chapters.length === 5) {
        try {
            const saveSuccess = await saveGame(game);
            if (!saveSuccess) {
                return res
                    .status(500)
                    .json({ message: "Errore nel salvataggio del gioco." });
            }
            clearInterval(game.countdownInterval);

            handleGameCompletion(game, gameId, req.io);

            return res.json({
                message: "Gioco completato e giocatori notificati.",
            });
        } catch (err) {
            return handleFinalError(err, res);
        }
    }

    req.io.in(gameId).emit("newChapterNotification", {
        timestamp: newChapter.timestamp,
        gameId,
    });

    game.turnIndex = (turnIndex + 1) % game.turnOrder.length;
    const nextPlayer = game.turnOrder[game.turnIndex];

    startCountdown(gameId);

    req.io.to(gameId).emit("nextChapterUpdate", {
        gameId: gameId,
        chapter: newChapter, // Capitolo appena aggiunto
        nextPlayer: game.turnOrder[game.turnIndex], // Prossimo giocatore (intero oggetto)
        previousAuthor: username,
    });

    res.json({ message: "Dati ricevuti correttamente." });
});

function handleGameCompletion(game, gameId, io) {
    console.log("Game completed, starting final process...");

    // Gestione dei socket (disconnessione dopo che il gioco è completato)
    io.to(gameId).emit("gameCompleted", {
        gameId: gameId,
    });

    removeGameFromPlayers(game);

    delete activeGames[gameId];

    // Disconnettiamo i socket e fermiamo il countdown
    setTimeout(() => {
        io.to(gameId).disconnectSockets(true);
        clearInterval(game.countdownInterval);
        console.log("Socket disconnessi dopo gameCompleted.");
    }, 500);
}

module.exports = router;
