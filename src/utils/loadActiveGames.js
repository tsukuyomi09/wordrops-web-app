const { client } = require("../database/db");
const { activeGames } = require("../services/gameManager");

async function loadActiveGames() {
    try {
        const result = await client.query(`
            SELECT 
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
                players
            FROM active_games
        `);

        for (const row of result.rows) {
            const {
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
            } = row;

            const game = {
                gameId: row.game_id,
                gameType: row.game_type,
                gameSpeed: row.game_speed,
                game_lang: row.game_lang,
                status: row.status,
                turnIndex: row.turn_index,
                countdownDuration: row.countdown_duration,
                countdownStart: row.countdown_start,
                countdownEnd: null,
                countdownInterval: null,
                startedAt: row.started_at,
                turnOrder: safeParseJSON(row.turn_order),
                players: safeParseJSON(row.players),
                chapters: [],
                votes: {},
                chat: [],
                publishStatus: null,
                readyPlayersCount: new Set(),
                chapterReadMap: new Map(),
                connections: [],
            };

            activeGames.set(game_id, game);
        }

        console.log("------ ACTIVE GAMES ------");
        for (const [gameId, gameData] of activeGames.entries()) {
            console.log(`Game ${gameId}:`);
            console.dir(gameData, { depth: null });
        }
    } catch (err) {
        console.error("❌ Error loading statistics:", err);
    }
}

function safeParseJSON(data) {
    if (!data) return null;
    if (typeof data === "string") {
        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    }
    return data;
}

module.exports = { loadActiveGames };
