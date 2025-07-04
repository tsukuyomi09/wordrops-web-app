const express = require("express");
const router = express.Router();
const { activeGames } = require("../../services/gameManager");
const checkAuth = require("../../middlewares/checkAuthToken");

router.get("/:gameId", checkAuth, async (req, res) => {
    const { gameId } = req.params;
    const game = activeGames.get(gameId);

    if (!game) {
        return res.status(404).json({ error: "Game not found" });
    }

    const { players, turnOrder, turnIndex, status, chapters } = game;

    if (!Array.isArray(players)) {
        return res.status(500).json({
            error: "Players are not in array format",
        });
    }

    const currentPlayer = players.find(
        (player) => player.user_id === turnOrder[turnIndex].user_id
    );

    if (!currentPlayer) {
        return res.status(500).json({
            error: "Error determining the current player",
        });
    }

    res.status(200).json({
        players,
        turnOrder,
        currentPlayer,
        status,
        chapters,
    });
});

module.exports = router;
