const express = require("express");
const router = express.Router();
const path = require("path");
const checkAuth = require("../../middlewares/checkAuthToken");
const checkUserGameStatus = require("../../services/checkUserGameStatus");
const { activeGames } = require("../../services/gameManager");

router.get("/:gameId", checkAuth, checkUserGameStatus, async (req, res) => {
    const { gameId: URLgameId } = req.params;
    const { isInGame } = req;
    const { gameId } = req;

    if (isInGame && URLgameId === gameId) {
        const game = activeGames.get(URLgameId);

        if (game.status == "to-start") {
            res.sendFile(
                path.join(__dirname, "..", "..", "views", "game.html"),
                {
                    popup: true,
                }
            );
        } else {
            res.sendFile(
                path.join(__dirname, "..", "..", "views", "game.html")
            );
        }
    } else {
        res.redirect(`/dashboard/${req.username}`);
    }
});

module.exports = router;
