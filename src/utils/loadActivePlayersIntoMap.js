const { client } = require("../database/db");
const { activePlayersMap } = require("../services/gameManager");

async function loadActivePlayersIntoMap() {
    try {
        const result = await client.query(`
            SELECT user_id, game_id, status, game_type, game_speed, game_lang
            FROM active_players_map
        `);

        for (const row of result.rows) {
            const {
                user_id,
                game_id,
                status,
                game_type,
                game_speed,
                game_lang,
            } = row;

            if (!activePlayersMap.has(user_id)) {
                activePlayersMap.set(user_id, { games: {} });
            }

            const playerData = activePlayersMap.get(user_id);
            playerData.games[game_id] = {
                status,
                gameType: game_type,
                gameSpeed: game_speed,
                game_lang,
            };
        }

        console.log("✅ activePlayersMap loaded");

        console.log("------ PLAYERS MAP ------");
        for (const [user_id, data] of activePlayersMap.entries()) {
            console.log(`Player ${user_id} (type: ${typeof user_id})`);
            for (const [game_id, gameData] of Object.entries(data.games)) {
                console.log(
                    `  → Game ID: ${game_id} (type: ${typeof game_id}) - status: ${
                        gameData.status
                    }, lang: ${gameData.game_lang}`
                );
            }
        }
    } catch (err) {
        console.error("❌ Error loading activePlayersMap:", err);
    }
}

module.exports = { loadActivePlayersIntoMap };
