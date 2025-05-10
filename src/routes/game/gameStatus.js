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
        });
    } else {
        res.status(404).json({ error: "Gioco non trovato" });
    }
});

module.exports = router;
