const { playersMap } = require("../services/gameManager");

async function handlePlayersMap(game) {
    if (!game || !Array.isArray(game.players)) {
        console.log(
            `[handlePlayersMap] Game or players not found for gameId: ${game?.gameId}`
        );
        return;
    }

    game.players.forEach((player) => {
        const playerId = player.user_id;
        console.log(`Checking player ${playerId}`);

        const playerData = playersMap.get(playerId);

        if (playerData && playerData.games[game.gameId]) {
            delete playerData.games[game.gameId];
            console.log(
                `Partita ${game.gameId} rimossa dalla playersMap per l'utente ${playerId}`
            );

            // Se non ci sono più partite, rimuovi anche il giocatore
            if (Object.keys(playerData.games).length === 0) {
                console.log(`Removing player ${playerId} from playersMap`);
                playersMap.delete(playerId);
            }
        } else {
            console.log(
                `Player ${playerId} non trovato in playersMap o partita non presente.`
            );
        }
    });
}

module.exports = {
    handlePlayersMap,
};
