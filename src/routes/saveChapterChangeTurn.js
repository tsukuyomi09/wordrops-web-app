const express = require("express");
const router = express.Router();
const { activeGames, startCountdown } = require("../services/gameManager");
const { saveNormalGame } = require("../services/saveGame");
const { playersMap } = require("../services/gameManager");
const checkAuth = require("../middlewares/checkAuthToken");
const { client } = require("../database/db");

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

    req.io.in(gameId).emit("newChapterNotification", {
        timestamp: newChapter.timestamp,
        gameId,
    });

    if (game.chapters.length === 5) {
        try {
            console.log(`five games reached`);
            console.log(`games chapters = ${game.chapters.length}`);
            const saveSuccess = await saveNormalGame(game);

            if (saveSuccess) {
                if (["ranked_slow", "ranked_fast"].includes(game.gameMode)) {
                    console.log(
                        "Ranked game detected, starting scoring process..."
                    );
                    game.status === "awaiting_scores";
                    req.io.to(newGameId).emit("awaiting_scores", {
                        chapters: game.chapters,
                        status: game.status,
                        // Altri dati...
                    });

                    setTimeout(() => {
                        req.io.to(newGameId).disconnectSockets(true);
                        clearInterval(game.countdownInterval);
                        console.log(
                            "Socket disconnessi dopo invio awaiting-scores."
                        );
                    }, 500);
                } else {
                    const players = game.players.players;

                    console.log("Contenuto di players:", players);

                    // Rimuovi il gioco dalla playersMap
                    players.forEach((player) => {
                        const playerId = player.id; // Ora otteniamo correttamente l'ID
                        const playerData = playersMap.get(playerId);
                        console.log(`Checking player ${playerId}`, playerData); // Debug

                        if (playerData) {
                            console.log(`Before delete:`, playerData.games);
                            delete playerData.games[gameId]; // Rimuovi il gioco

                            console.log(`After delete:`, playerData.games); // Verifica se è stato rimosso

                            // Se il giocatore non ha più giochi, rimuovilo dalla playersMap
                            if (Object.keys(playerData.games).length === 0) {
                                console.log(
                                    `Removing player ${playerId} from playersMap`
                                );
                                playersMap.delete(playerId);
                            }
                        }
                    });
                    activeGames.delete(newGameId);
                    req.io.to(gameId).emit("gameCompleted");
                }

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
            return res.status(500).json({
                message: "Errore nel processo di completamento del gioco.",
            });
        }
    }

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

module.exports = router;
