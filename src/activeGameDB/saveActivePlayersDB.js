const { client } = require("../database/db");

async function saveActivePlayersDB(playersData) {
    if (!playersData || playersData.length === 0) return;

    const columns = [
        "user_id",
        "game_id",
        "status",
        "game_type",
        "game_speed",
        "game_lang",
    ];
    const values = [];
    const placeholders = [];

    playersData.forEach((player, i) => {
        const idxStart = i * columns.length + 1;
        placeholders.push(
            `(${columns.map((_, j) => `$${idxStart + j}`).join(", ")})`
        );
        values.push(
            player.user_id,
            player.game_id,
            player.status || "in_progress",
            player.game_type || null,
            player.game_speed || null,
            player.game_lang || null
        );
    });

    const query = `
    INSERT INTO active_players_map (${columns.join(", ")})
    VALUES ${placeholders.join(", ")}
    ON CONFLICT (user_id, game_id) DO NOTHING
  `;

    try {
        await client.query(query, values);
    } catch (err) {
        console.error("Error saving active players to DB:", err);
        throw err;
    }
}

module.exports = { saveActivePlayersDB };
