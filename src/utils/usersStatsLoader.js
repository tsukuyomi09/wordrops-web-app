const { client } = require("../database/db");
const { playerStatsMap, PlayerStatistics } = require("./playerStatistics");

async function loadPlayerStatsIntoMap() {
    try {
        const result = await client.query(`
            SELECT 
                user_id,
                classic_played,
                ranked_played,
                stories_abandoned,
                ranked_score,
                perfect_performances,
                worst_performances
            FROM user_statistics
        `);

        for (const row of result.rows) {
            const stats = new PlayerStatistics(row.user_id);
            stats.classic_played = row.classic_played;
            stats.ranked_played = row.ranked_played;
            stats.stories_abandoned = row.stories_abandoned;
            stats.ranked_score = row.ranked_score;
            stats.perfect_performances = row.perfect_performances;
            stats.worst_performances = row.worst_performances;

            playerStatsMap.set(row.user_id, stats);
        }
        const top5 = Array.from(playerStatsMap.entries())
            .sort((a, b) => b[1].ranked_played - a[1].ranked_played)
            .slice(0, 5);

        console.log("🏆 Top 5 utenti per ranked_played:");
        for (const [user_id, stats] of top5) {
            console.log(
                `User ${user_id}: ranked_played = ${stats.ranked_played}`
            );
        }
    } catch (err) {
        console.error("❌ Errore nel caricamento delle statistiche:", err);
    }
}

module.exports = { loadPlayerStatsIntoMap };
