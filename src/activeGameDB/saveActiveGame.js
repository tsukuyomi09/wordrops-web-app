const { client } = require("../database/db");

async function saveGameToDB(game) {
    const query = `
        INSERT INTO active_games (
            game_id,
            game_type,
            game_speed,
            game_lang,
            status,
            turn_index,
            countdown_duration,
            countdown_start,
            started_at,
            turn_order,
            players,
            chapters
        )
        VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,
            $10,$11,$12
        )
    `;

    const values = [
        game.gameId,
        game.gameType,
        game.gameSpeed,
        game.game_lang,
        game.status,
        game.turnIndex,
        game.countdownDuration,
        game.countdownStart ? new Date(game.countdownStart) : null,
        game.startedAt ? new Date(game.startedAt) : null,
        JSON.stringify(game.turnOrder),
        JSON.stringify(game.players),
        JSON.stringify(game.chapters),
    ];

    try {
        await client.query(query, values);
    } catch (err) {
        console.error("Error saving game to DB:", err);
        throw err;
    }
}

module.exports = { saveGameToDB };
