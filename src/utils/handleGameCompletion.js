const { activeGames } = require("../services/gameManager");
const { handlePlayersMap } = require("./removeGameFromPlayers");
const {
    deleteActiveGameDataDB,
} = require("../activeGameDB/deleteActiveGameDataDB");

function handleGameCompletion(game, gameId, io) {
    io.to(gameId).emit("gameCompleted", {
        gameId: gameId,
    });

    clearInterval(game.countdownInterval);
    game.countdownInterval = null;
    deleteActiveGameDataDB(gameId);
    handlePlayersMap(game);
    delete activeGames[gameId];
}

module.exports = { handleGameCompletion };
