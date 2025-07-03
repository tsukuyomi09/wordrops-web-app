const express = require("express");
const router = express.Router();
const { activeGames } = require("../../services/gameManager");
const checkAuth = require("../../middlewares/checkAuthToken");

router.get("/:gameId", checkAuth, async (req, res) => {
    const { gameId } = req.params;
    const game = activeGames.get(gameId);

    if (game) {
        res.json({
            status: game.status,
            alreadyReady: game.readyPlayersCount.has(req.user_id),
        });
    } else {
        res.status(404).json({ error: "Game not found" });
    }
});

module.exports = router;
