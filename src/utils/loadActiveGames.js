const { client } = require("../database/db");
const { activeGames } = require("../services/gameManager");
const { startCountdown } = require("../services/gameCountdownStart");

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
                players,
                chapters
            FROM active_games
        `);

        await Promise.all(
            result.rows.map(async (row) => {
                const game = {
                    gameId: row.game_id,
                    gameType: row.game_type,
                    gameSpeed: row.game_speed,
                    game_lang: row.game_lang,
                    status: row.status,
                    turnIndex: row.turn_index,
                    countdownDuration: Number(row.countdown_duration),
                    countdownStart: new Date(row.countdown_start).getTime(),
                    countdownEnd: null,
                    countdownInterval: null,
                    startedAt: row.started_at,
                    turnOrder: safeParseJSON(row.turn_order),
                    players: safeParseJSON(row.players),
                    chapters: row.chapters || [],
                    votes: {},
                    chat: [],
                    publishStatus: null,
                    readyPlayersCount: new Set(),
                    chapterReadMap: new Map(),
                    connections: [],
                };

                activeGames.set(row.game_id, game);
                await startCountdown(row.game_id, true);
            })
        );

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
