const express = require("express");
const router = express.Router();
const { activeGames } = require("../../services/gameManager");
const checkAuth = require("../../middlewares/checkAuthToken");

router.get("/:gameId", checkAuth, async (req, res) => {
    const { gameId } = req.params;
    const game = activeGames.get(gameId); // Ottieni il gioco dalla mappa

    if (game) {
        // Restituisci solo lo stato del gioco
        res.json({
            status: game.status,
        });
    } else {
        res.status(404).json({ error: "Gioco non trovato" });
    }
});

module.exports = router;
