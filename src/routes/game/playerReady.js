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
        return res.status(404).json({ error: "Game not found" });
    }

    game.readyPlayersCount.add(user_id);

    if (game.readyPlayersCount.size === 5) {
        game.status = "in-progress";
        game.readyPlayersCount.clear();
        startCountdown(gameId, false);
        req.io.to(gameId).emit("game-ready-popup");
        savePlayersDb(game, gameId);
        const gameAfter = activeGames.get(gameId);
        console.log("\n--- GAME STATUS DOPO START COUNTDOWN ---");
        console.log(
            "countdownStart:",
            gameAfter.countdownStart,
            typeof gameAfter.countdownStart
        );
        console.log(
            "countdownEnd:",
            gameAfter.countdownEnd,
            typeof gameAfter.countdownEnd
        );
        console.log(
            "countdownDuration:",
            gameAfter.countdownDuration,
            typeof gameAfter.countdownDuration
        );
        console.log("-------------------------\n");
        return res.json({ status: "in-progress" });
    }

    res.json({ status: "ready" });
});

module.exports = router;
