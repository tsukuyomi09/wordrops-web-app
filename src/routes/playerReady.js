const express = require("express");
const router = express.Router();
const { activeGames, startCountdown } = require("../services/gameManager");
const checkAuth = require("../middlewares/checkAuthToken");

router.post("/game/:gameId/player-ready", checkAuth, async (req, res) => {
    const { gameId } = req.params;

    // Cerca il gioco nella mappa activeGames
    const game = activeGames.get(gameId);
    if (!game) {
        console.log(`Gioco con ID ${gameId} non trovato.`);
        return res.status(404).json({ error: "Gioco non trovato" });
    }

    // Incrementa il contatore dei giocatori pronti
    game.readyPlayersCount = (game.readyPlayersCount || 0) + 1;

    // Se il numero di giocatori pronti raggiunge 5, inizia il gioco
    if (game.readyPlayersCount === 5) {
        game.status = "in-progress"; // Imposta lo stato del gioco come "in-progress"
        startCountdown(gameId); // Avvia il countdown
        req.io.to(gameId).emit("game-ready-popup");
        return res.json({ status: "in-progress" });
    }

    res.json({ status: "ready" });
});

module.exports = router;
