const { playersMap } = require("../services/gameManager");

async function handlePlayersMap(game) {
    if (!game || !Array.isArray(game.players)) {
        console.log(
            `[handlePlayersMap] Game or players not found for gameId: ${game?.gameId}`
        );
        return;
    }

    const isRanked = game.gameType === "ranked";

    game.players.forEach((player) => {
        const playerId = player.user_id;
        console.log(`Checking player ${playerId}`);

        const playerData = playersMap.get(playerId);

        if (playerData && playerData.games[game.gameId]) {
            if (isRanked) {
                // Se il gioco è ranked, cambia lo stato in "waiting_score"
                playerData.games[game.gameId].status = "waiting_score";
                console.log(
                    `🎮 Partita ${game.gameId} dello user ${playerId} è ora in stato "waiting_score"`
                );
            } else {
                // Se il gioco è normal, rimuovi la partita
                delete playerData.games[game.gameId];
                console.log(
                    `Partita ${game.gameId} rimossa dalla playersMap per l'utente ${playerId}`
                );
            }

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
