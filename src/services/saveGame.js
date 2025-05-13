const { generateFullMetadata } = require("../utils/textGeneratorAi");
const { calculateAndAssignRatings } = require("./calculateAndAssignRatings");
const { saveRankedNotification } = require("../utils/handleRankedNotification");
const {
    PlayerStatistics,
    playerStatsMap,
} = require("../utils/playerStatistics");

const { client } = require("../database/db");

async function saveGame(game) {
    const isRanked = game.gameType === "ranked";
    try {
        const chaptersToElaborate = game.chapters.map((chapter, index) => ({
            chapterNumber: index + 1,
            title: chapter.title,
            content: chapter.content,
        }));

        const metadata = await generateFullMetadata(
            chaptersToElaborate,
            game.gameType
        );

        if (isRanked) {
            game.chapters = await calculateAndAssignRatings(
                metadata.chapterRatings,
                game.chapters
            );
        }

        const finishedAt = new Date();
        const result = await client.query(
            `INSERT INTO games_completed (title, started_at, finished_at, game_uuid, game_type, game_speed, back_cover, publish, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`,
            [
                metadata.title,
                game.startedAt,
                finishedAt,
                game.gameId,
                game.gameType,
                game.gameSpeed,
                metadata.backCover,
                "publish",
                "completed",
            ]
        );
        const databaseGameId = result.rows[0].id;

        await Promise.all(
            game.chapters.map((chapter, index) => {
                const chapterValues = [
                    databaseGameId,
                    chapter.title,
                    chapter.content,
                    chapter.user_id,
                    index + 1,
                    isRanked ? chapter.comment : null,
                    isRanked ? chapter.points : null,
                ];

                return client.query(
                    `INSERT INTO games_chapters (game_id, title, content, author_id, turn_position, score_comment, score, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                    chapterValues
                );
            })
        );

        for (const chapter of game.chapters) {
            if (!playerStatsMap.has(chapter.user_id)) {
                const playerStats = new PlayerStatistics(chapter.user_id);
                playerStatsMap.set(chapter.user_id, playerStats);
            }
            const stats = playerStatsMap.get(chapter.user_id);
            const abandoned = !chapter.isValid;
            const score = isRanked ? chapter.points : null;

            stats.updateStats(
                isRanked ? "ranked" : "classic",
                abandoned,
                score
            );

            await client.query(
                `UPDATE user_statistics SET
                    classic_played = $1,
                    ranked_played = $2,
                    stories_abandoned = $3,
                    ranked_score = $4,
                    perfect_performances = $5,
                    worst_performances = $6
                 WHERE user_id = $7`,
                [
                    stats.classic_played,
                    stats.ranked_played,
                    stats.stories_abandoned,
                    stats.ranked_score,
                    stats.perfect_performances,
                    stats.worst_performances,
                    chapter.user_id,
                ]
            );
        }

        console.log("Mappa statistiche giocatori:");
        playerStatsMap.forEach((playerStats, user_id) => {
            console.log(`UserId: ${user_id}, Statistiche: `, playerStats);
        });

        await Promise.all(
            metadata.genres.map((Id) => {
                return client.query(
                    `INSERT INTO game_genres (game_id, genre_id) VALUES ($1, $2)`,
                    [databaseGameId, genreId]
                );
            })
        );
        if (isRanked) {
            await saveRankedNotification(game.chapters, databaseGameId);
        }
        return true;
    } catch (err) {
        console.error("Error saving game and chapters:", err);
        throw err;
    }
}

module.exports = { saveGame };
