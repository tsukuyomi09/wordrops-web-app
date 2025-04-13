const express = require("express");
const router = express.Router();
const { activeGames } = require("../services/gameManager");
const { startCountdown } = require("../services/gameCountdownStart");
const { saveNormalGame } = require("../services/saveGame");
const { removeGameFromPlayers } = require("../utils/removeGameFromPlayers");
const checkAuth = require("../middlewares/checkAuthToken");

router.post("/saveChapterChangeTurn/:gameId", checkAuth, async (req, res) => {
    const { gameId } = req.params;
    const user_id = req.user_id;
    const { title, content, currentUser } = req.body; // Dati inviati dal client
    const username = req.username; // Dati dal middleware

    if (username !== currentUser) {
        res.status(403).json({ message: "Utente non autorizzato." });
        return;
    }

    const game = activeGames.get(gameId);

    if (!game) {
        res.status(404).json({ message: "Partita non trovata." });
        return;
    }

    const turnIndex = game.turnIndex;
    const currentTurnPlayer = game.turnOrder[turnIndex];

    if (!currentTurnPlayer) {
        res.status(500).json({
            message: "Errore nel recupero del turno corrente.",
        });
        return;
    }

    if (currentTurnPlayer.username !== currentUser) {
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
            const saveSuccess = await saveNormalGame(game);
            if (!saveSuccess) {
                return res
                    .status(500)
                    .json({ message: "Errore nel salvataggio del gioco." });
            }
            clearInterval(game.countdownInterval);

            if (["ranked_slow", "ranked_fast"].includes(game.gameMode)) {
                handleRankedGameFlow(game, gameId, req.io);
            } else {
                handleCasualGameFlow(game, gameId, req.io);
            }

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

function handleRankedGameFlow(game, gameId, io) {
    console.log("Ranked game detected, starting scoring process...");
    game.status = "awaiting_scores"; // <-- era `===` prima, corretto ora

    io.to(gameId).emit("awaiting_scores", {
        chapters: game.chapters,
        status: game.status,
    });

    setTimeout(() => {
        io.to(gameId).disconnectSockets(true);
        clearInterval(game.countdownInterval);
        console.log("Socket disconnessi dopo invio awaiting-scores.");
    }, 500);
}

function handleCasualGameFlow(game, gameId, io) {
    removeGameFromPlayers(game);
    activeGames.delete(gameId);
    io.to(gameId).emit("gameCompleted", {
        reason: "La partita è stata annullata: troppi capitoli nulli.",
        gameId: gameId, // oppure semplicemente `gameId,`
    });
}
module.exports = router;
