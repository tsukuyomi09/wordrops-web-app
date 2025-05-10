const { activeGames } = require("../services/gameManager");
const { handlePlayersMap } = require("./removeGameFromPlayers");

function handleGameCompletion(game, gameId, io) {
    io.to(gameId).emit("gameCompleted", {
        gameId: gameId,
    });

    clearInterval(game.countdownInterval);
    game.countdownInterval = null;

    handlePlayersMap(game);
    delete activeGames[gameId];
}

module.exports = { handleGameCompletion };
