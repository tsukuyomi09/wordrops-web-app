const { playersMap } = require("../services/gameManager");

async function handlePlayersMap(game) {
    if (!game || !Array.isArray(game.players)) {
        console.error(
            `[handlePlayersMap] Game or players not found for gameId: ${game?.gameId}`
        );
        return;
    }

    game.players.forEach((player) => {
        const playerId = player.user_id;
        const playerData = playersMap.get(playerId);

        if (!playerData) return;

        if (playerData && playerData.games[game.gameId]) {
            delete playerData.games[game.gameId];
        }
        if (Object.keys(playerData.games).length === 0) {
            playersMap.delete(playerId);
        }
    });
}

module.exports = {
    handlePlayersMap,
};
