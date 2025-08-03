const { client } = require("../database/db");

async function deleteActiveGameDataDB(gameId) {
    if (!gameId) return;

    try {
        await client.query("BEGIN");

        await client.query(`DELETE FROM active_games WHERE game_id = $1`, [
            gameId,
        ]);

        await client.query(
            `DELETE FROM active_players_map WHERE game_id = $1`,
            [gameId]
        );

        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error deleting active game data:", err);
    }
}

module.exports = { deleteActiveGameDataDB };
