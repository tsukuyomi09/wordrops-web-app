const express = require("express");
const router = express.Router();
const { activeGames, startCountdown } = require("../services/gameManager");
const { saveNormalGame } = require("../services/saveGame");
const { playersMap } = require("../services/gameManager");
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
    };

    game.chapters.push(newChapter);
    console.log(`games chapters = ${game.chapters.length}`);
    if (game.chapters.length === 5) {
        try {
            console.log(`five games reached`);
            // Salva il gioco e i capitoli
            const saveSuccess = await saveNormalGame(game); // Attendi il risultato della funzione
            console.log("Contenuto di saveSuccess:", saveSuccess);

            if (saveSuccess) {
                const players = game.players;

                console.log("Contenuto di players:", players);

                // Rimuovi il gioco dalla playersMap
                players.forEach((playerId) => {
                    const player = playersMap.get(playerId);
                    console.log(`Checking player ${playerId}`, player); // Debug

                    if (player) {
                        console.log(`Before delete:`, player.games);
                        delete player.games[gameId]; // Rimuovi il gioco

                        console.log(`After delete:`, player.games); // Verifica se è stato rimosso

                        // Se il giocatore non ha più giochi, rimuovilo dalla playersMap
                        if (Object.keys(player.games).length === 0) {
                            console.log(
                                `Removing player ${playerId} from playersMap`
                            );
                            playersMap.delete(playerId);
                        }
                    }
                });

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
            return res.status(500).json({
                message: "Errore nel processo di completamento del gioco.",
            });
        }
    }

    game.turnIndex = (turnIndex + 1) % game.turnOrder.length;
    const nextPlayer = game.turnOrder[game.turnIndex];

    console.log("Log del game");

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
