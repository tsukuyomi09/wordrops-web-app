const express = require("express");
const router = express.Router();
const { activeGames } = require("../../services/gameManager");
const { startCountdown } = require("../../services/gameCountdownStart");
const { savePlayersDb } = require("../../utils/savePlayersDb");
const checkAuth = require("../../middlewares/checkAuthToken");

router.post("/:gameId", checkAuth, async (req, res) => {
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
        console.log(`player-ready function - players are ready`);
        game.status = "in-progress"; // Imposta lo stato del gioco come "in-progress"
        startCountdown(gameId); // Avvia il countdown
        req.io.to(gameId).emit("game-ready-popup");
        savePlayersDb(game);
        return res.json({ status: "in-progress" });
    }

    res.json({ status: "ready" });
});

module.exports = router;
