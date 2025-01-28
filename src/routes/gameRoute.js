const express = require("express");
const router = express.Router();
const path = require("path");
const checkAuth = require("../middlewares/checkAuthToken");
const checkUserGameStatus = require("../routes/checkUserGameStatus");
const { activeGames } = require("../services/gameManager");

router.get(
    "/game/:gameId",
    checkAuth,
    checkUserGameStatus,
    async (req, res) => {
        const { gameId: URLgameId } = req.params; // Estrai e rinomina il gameId in URLgameId
        const { isInGame } = req;
        const { gameId } = req;

        console.log(
            `User ${req.user_id} is checking game with ID: ${URLgameId}`
        );

        if (isInGame && URLgameId === gameId) {
            const game = activeGames.get(URLgameId);

            if (game.status == "to-start") {
                console.log(
                    `Game ${gameId} is not started yet, showing popup...`
                );
                // Invio della pagina di gioco con il flag del popup
                res.sendFile(
                    path.join(__dirname, "..", "..", "views", "game.html"),
                    {
                        popup: true, // Indica al client che deve mostrare il popup
                    }
                );
            } else {
                console.log(`Game ${gameId} is in progress, no popup.`);
                // Se il gioco è in corso, invia solo la pagina senza il popup
                res.sendFile(
                    path.join(__dirname, "..", "..", "views", "game.html")
                );
            }
        } else {
            console.log(
                `User ${req.user_id} is not in game ${URLgameId}, redirecting to dashboard.`
            );
            res.redirect(`/dashboard/${req.username}`);
        }
    }
);

module.exports = router;
