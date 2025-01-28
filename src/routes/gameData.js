const express = require("express");
const router = express.Router();
const { activeGames } = require("../services/gameManager");
const checkAuth = require("../middlewares/checkAuthToken");

router.get("/game-data/:gameId", checkAuth, (req, res) => {
    const { gameId } = req.params;
    const game = activeGames.get(gameId);

    if (!game) {
        return res.status(404).json({ error: "Gioco non trovato" });
    }

    const { players, turnOrder, turnIndex } = game;
    const currentPlayer = players.find(
        (player) => player.id === turnOrder[turnIndex].id
    );

    if (!currentPlayer) {
        return res
            .status(500)
            .json({
                error: "Errore nella determinazione del giocatore attuale",
            });
    }

    res.status(200).json({
        players,
        turnOrder,
        currentPlayer,
    });
});

module.exports = router;
