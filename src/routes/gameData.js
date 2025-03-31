const express = require("express");
const router = express.Router();
const { activeGames } = require("../services/gameManager");
const checkAuth = require("../middlewares/checkAuthToken");

router.get("/game-data/:gameId", checkAuth, (req, res) => {
    const { gameId } = req.params;
    const game = activeGames.get(gameId);

    if (!game) {
        return res.status(404).json({ error: "Gioco non trovato" });
    }

    // Accedi correttamente all'array di giocatori
    const { players, turnOrder, turnIndex, status } = game;
    const playersArray = players.players; // Qui accedi al vero array di giocatori

    if (!Array.isArray(playersArray)) {
        return res.status(500).json({
            error: "I giocatori non sono in formato array",
        });
    }

    const currentPlayer = playersArray.find(
        (player) => player.id === turnOrder[turnIndex].id
    );

    if (!currentPlayer) {
        return res.status(500).json({
            error: "Errore nella determinazione del giocatore attuale",
        });
    }

    res.status(200).json({
        players: playersArray,
        turnOrder,
        currentPlayer,
        status,
    });
});

module.exports = router;
