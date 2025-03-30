const express = require("express");
const router = express.Router();
const { activeGames } = require("../services/gameManager");
const checkAuth = require("../middlewares/checkAuthToken");

router.get("/games/:gameId/chapters", checkAuth, (req, res) => {
    const { gameId } = req.params;
    const game = activeGames.get(gameId);

    // Restituisce direttamente i capitoli
    res.json(game.chapters);
});

module.exports = router;
