const { playersMap } = require("../services/gameManager");

async function removeGameFromPlayers(game) {
    if (!game || !Array.isArray(game.players)) {
        console.log(
            `[removeGamePlayersMap] Game or players not found for gameId: ${game?.gameId}`
        );
        return;
    }

    const players = game.players;
    console.log("Players array:", players);

    players.forEach((player) => {
        const playerId = player.user_id; // <-- cambiato da .id a .user_id
        console.log(`Checking player ${playerId}`);

        const playerData = playersMap.get(playerId);

        if (playerData) {
            delete playerData.games[game.gameId];
            console.log(`After delete:`, playerData.games);

            if (Object.keys(playerData.games).length === 0) {
                console.log(`Removing player ${playerId} from playersMap`);
                playersMap.delete(playerId);
            }
        } else {
            console.log(`Player ${playerId} not found in playersMap.`);
        }
    });
}

module.exports = {
    removeGameFromPlayers,
};
