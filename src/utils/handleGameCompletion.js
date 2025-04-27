const { activeGames } = require("../services/gameManager");
const { removeGameFromPlayers } = require("./removeGameFromPlayers");

function handleGameCompletion(game, gameId, io) {
    console.log("Game completed, starting final process...");

    // Gestione dei socket (disconnessione dopo che il gioco è completato)
    io.to(gameId).emit("gameCompleted", {
        gameId: gameId,
    });
    clearInterval(game.countdownInterval);
    removeGameFromPlayers(game);
    delete activeGames[gameId];

    // Disconnettiamo i socket e fermiamo il countdown
    setTimeout(() => {
        io.to(gameId).disconnectSockets(true);
        console.log("Socket disconnessi dopo gameCompleted.");
    }, 500);
}

module.exports = { handleGameCompletion };
