const { activeGames } = require("../services/gameManager");
const { handlePlayersMap } = require("./removeGameFromPlayers");

function handleGameCompletion(game, gameId, io) {
    console.log("Game completed, starting final process...");

    // Gestione dei socket (disconnessione dopo che il gioco è completato)
    io.to(gameId).emit("gameCompleted", {
        gameId: gameId,
    });
    clearInterval(game.countdownInterval);
    handlePlayersMap(game);
    delete activeGames[gameId];
}

module.exports = { handleGameCompletion };
