const express = require("express");
const router = express.Router();
const { activeGames } = require("../services/gameManager");
const checkAuth = require("../middlewares/checkAuthToken");

router.get("/games-data", checkAuth, async (req, res) => {
    let gameIds;
    try {
        gameIds = JSON.parse(req.query.gameIds);
    } catch (error) {
        return res.status(400).json({ error: "Formato gameIds non valido" });
    }

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
        return res.status(400).json({ error: "Nessun gameId fornito" });
    }

    const gameDataPromises = gameIds.map(async (gameId) => {
        const game = activeGames.get(gameId);

        if (!game) {
            return { gameId, error: "Gioco non trovato" };
        }

        const { players, turnOrder, turnIndex, status } = game;
        const currentPlayer = players.find(
            (player) => player.id === turnOrder[turnIndex].id
        );

        if (!currentPlayer) {
            return {
                gameId,
                error: "Errore nella determinazione del giocatore attuale",
            };
        }

        return {
            gameId,
            players,
            turnOrder,
            currentPlayer,
            status,
        };
    });

    try {
        const gameData = await Promise.all(gameDataPromises);
        res.status(200).json(gameData);
    } catch (error) {
        res.status(500).json({
            error: "Errore nel recupero dei dati dei giochi",
        });
    }
});

module.exports = router;
