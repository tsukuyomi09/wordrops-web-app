const express = require("express");
const router = express.Router();
const { activeGames } = require("../../services/gameManager");
const { startCountdown } = require("../../services/gameCountdownStart");
const { savePlayersDb } = require("../../utils/savePlayersDb");
const checkAuth = require("../../middlewares/checkAuthToken");

router.post("/:gameId", checkAuth, async (req, res) => {
    const { gameId } = req.params;
    const user_id = req.user_id;

    const game = activeGames.get(gameId);
    if (!game) {
        return res.status(404).json({ error: "Gioco non trovato" });
    }

    game.readyPlayersCount.add(user_id);

    if (game.readyPlayersCount.size === 5) {
        game.status = "in-progress";
        game.readyPlayersCount.clear();
        startCountdown(gameId);
        req.io.to(gameId).emit("game-ready-popup");
        savePlayersDb(game, gameId);
        return res.json({ status: "in-progress" });
    }

    res.json({ status: "ready" });
});

module.exports = router;
