const express = require("express");
const router = express.Router();
const { activeGames } = require("../services/gameManager");
const checkAuth = require("../middlewares/checkAuthToken");

app.post("/api/save-scores", checkAuth, async (req, res) => {
    try {
        const user_id = req.user_id;
        const { gameId } = req.body;

        const game = activeGames.get(gameId);
        if (!game) {
            return res
                .status(404)
                .json({ success: false, message: "Game not found" });
        }

        const playerData = playersMap.get(user_id);
        if (!playerData) {
            return res
                .status(404)
                .json({ success: false, message: "Player not found" });
        }

        // creiamo funzione per salvare i voti per l'utente dentro activeGames

        players.forEach((player) => {
            const playerId = player.id;
            const playerData = playersMap.get(playerId);
            console.log(`Checking player ${playerId}`, playerData); // Debug

            if (playerData) {
                console.log(`Before delete:`, playerData.games);
                delete playerData.games[gameId]; // Rimuovi il gioco

                console.log(`After delete:`, playerData.games); // Verifica se è stato rimosso

                // Se il giocatore non ha più giochi, rimuovilo dalla playersMap
                if (Object.keys(playerData.games).length === 0) {
                    console.log(`Removing player ${playerId} from playersMap`);
                    playersMap.delete(playerId);
                }
            }
        });
        activeGames.delete(newGameId);
        res.json({ success: true });
    } catch (error) {
        console.error("Errore durante il salvataggio dei punteggi:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});
