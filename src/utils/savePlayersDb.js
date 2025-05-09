const { client } = require("../database/db");

async function savePlayersDb(game) {
    try {
        await Promise.all(
            game.players.map((player) => {
                const playerValues = [game.gameId, player.user_id, new Date()];

                return client.query(
                    `INSERT INTO game_players (game_uuid, user_id, joined_at)
                     VALUES ($1, $2, $3)`,
                    playerValues
                );
            })
        );
    } catch (error) {
        console.log(
            "[savePlayersDb] Errore durante il salvataggio dei giocatori:",
            error
        );
    }
}

module.exports = { savePlayersDb };
