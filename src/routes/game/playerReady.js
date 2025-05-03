const express = require("express");
const router = express.Router();
const { activeGames } = require("../../services/gameManager");
const { startCountdown } = require("../../services/gameCountdownStart");
const { savePlayersDb } = require("../../utils/savePlayersDb");
const checkAuth = require("../../middlewares/checkAuthToken");

router.post("/:gameId", checkAuth, async (req, res) => {
    const { gameId } = req.params;

    const game = activeGames.get(gameId);
    if (!game) {
        return res.status(404).json({ error: "Gioco non trovato" });
    }

    game.readyPlayersCount = (game.readyPlayersCount || 0) + 1;

    if (game.readyPlayersCount === 5) {
        game.status = "in-progress";
        startCountdown(gameId);
        req.io.to(gameId).emit("game-ready-popup");
        savePlayersDb(game);
        return res.json({ status: "in-progress" });
    }

    res.json({ status: "ready" });
});

module.exports = router;
