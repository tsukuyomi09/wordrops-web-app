const express = require("express");
const router = express.Router();
const { activeGames, startCountdown } = require("../services/gameManager");
const { saveNormalGame } = require("../services/saveGame");
const { resetUserStatus, deleteGameFromDB } = require("../database/db"); // Supponiamo di avere queste funzioni
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

    const newChapter = { title, content, author: username, user_id: user_id };

    game.chapters.push({ title, content, author: username, user_id: user_id });

    if (game.chapters.length === 5) {
        try {
            // Salva il gioco e i capitoli
            const saveSuccess = await saveNormalGame(game); // Attendi il risultato della funzione

            if (saveSuccess) {
                const players = game.players;

                // Rimuovi il gioco dalla Map
                activeGames.delete(gameId);

                // Resetta gli utenti e cancella dal DB
                try {
                    await deleteGameFromDB(gameId); // Cancella dal DB
                    await resetUserStatus(players); // Resetta gli utenti a 'idle'
                } catch (err) {
                    console.error(
                        "Errore durante la cancellazione dal database:",
                        err
                    );
                    return res
                        .status(500)
                        .json({ message: "Errore durante la cancellazione." });
                }

                req.io.to(gameId).emit("gameCompleted");

                // Risposta positiva al client
                return res.json({
                    message: "Gioco completato e giocatori notificati.",
                });
            } else {
                // Se il salvataggio del gioco non ha avuto successo, invia un errore
                return res
                    .status(500)
                    .json({ message: "Errore nel salvataggio del gioco." });
            }
        } catch (err) {
            console.error(
                "Errore durante il processo di salvataggio del gioco:",
                err
            );
            return res
                .status(500)
                .json({
                    message: "Errore nel processo di completamento del gioco.",
                });
        }
    }

    game.turnIndex = (turnIndex + 1) % game.turnOrder.length;
    const nextPlayer = game.turnOrder[game.turnIndex];

    console.log("Log del game");

    startCountdown(gameId);

    req.io.to(gameId).emit("nextChapterUpdate", {
        chapter: newChapter, // Capitolo appena aggiunto
        nextPlayer: game.turnOrder[game.turnIndex], // Prossimo giocatore (intero oggetto)
        previousAuthor: username,
    });

    res.json({ message: "Dati ricevuti correttamente." });
});

module.exports = router;
