const { client } = require("../database/db");
const { PlayerStatistics } = require("../utils/playerStatistics");

async function getPlayerStatsFromDB(user_id) {
    try {
        const result = await client.query(
            `SELECT 
                classic_played,
                ranked_played,
                stories_abandoned,
                ranked_score,
                perfect_performances,
                worst_performances
             FROM user_statistics
             WHERE user_id = $1`,
            [user_id]
        );
        const row = result.rows[0];
        if (!row) return null;

        const playerStats = new PlayerStatistics(user_id);
        playerStats.classic_played = row.classic_played;
        playerStats.ranked_played = row.ranked_played;
        playerStats.stories_abandoned = row.stories_abandoned;
        playerStats.ranked_score = row.ranked_score;
        playerStats.perfect_performances = row.perfect_performances;
        playerStats.worst_performances = row.worst_performances;

        return playerStats;
    } catch (err) {
        console.error(
            `[getPlayerStatsFromDB] Errore DB per user ${user_id}:`,
            err
        );
        throw err;
    }
}

module.exports = getPlayerStatsFromDB;
