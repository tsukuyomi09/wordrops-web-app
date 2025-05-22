const { generateFullMetadata } = require("../utils/textGeneratorAi");
const { generateImageWithOpenAI } = require("../utils/generateImageWithOpenAI");
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

        console.log(`prompt per immagine: ${metadata.imagePrompt}`);

        if (isRanked) {
            game.chapters = await calculateAndAssignRatings(
                metadata.chapterRatings,
                game.chapters
            );
        }

        const finishedAt = new Date();
        const result = await client.query(
            `INSERT INTO games_completed (title, started_at, finished_at, game_uuid, game_type, game_speed, back_cover, prompt_image, publish, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id`,
            [
                metadata.title,
                game.startedAt,
                finishedAt,
                game.gameId,
                game.gameType,
                game.gameSpeed,
                metadata.backCover,
                metadata.imagePrompt,
                "waiting-image",
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

        await Promise.all(
            metadata.genres.map((Id) => {
                return client.query(
                    `INSERT INTO game_genres (game_id, genre_id) VALUES ($1, $2)`,
                    [databaseGameId, Id]
                );
            })
        );
        if (isRanked) {
            await saveRankedNotification(game.chapters, databaseGameId);
        }

        try {
            console.log(
                "Inizio generazione immagine per gameId:",
                databaseGameId
            );

            const imageUrl = await generateImageWithOpenAI(
                databaseGameId,
                metadata.title,
                metadata.imagePrompt
            );

            console.log("Immagine generata, imageUrl:", imageUrl);

            if (!imageUrl) {
                console.error(
                    "imageUrl è undefined o null, interrompo l'update"
                );
                return false;
            }

            console.log("Eseguo UPDATE nel DB per gameId:", databaseGameId);
            const res = await client.query(
                `UPDATE games_completed
                SET cover_image_url  = $2, publish = 'publish', prompt_image = $3
                WHERE id = $1
                RETURNING cover_image_url , publish, prompt_image`,
                [databaseGameId, imageUrl, metadata.imagePrompt]
            );

            console.log("Risultato UPDATE:", res.rowCount, "righe aggiornate");
            if (res.rowCount === 0) {
                console.warn("Nessuna riga aggiornata per id:", databaseGameId);
                return false;
            }

            console.log(
                "Nuovo valore story_cover_url salvato:",
                res.rows[0].cover_image_url
            );
            console.log("publish:", res.rows[0].publish);
            console.log("prompt_image:", res.rows[0].prompt_image);
            console.log("Image generated and saved correttamente");

            return true;
        } catch (err) {
            console.error("Error generazione immagine o update DB:", err);
            throw err;
        }

        return true;
    } catch (err) {
        console.error("Error saving game and chapters:", err);
        throw err;
    }
}

module.exports = { saveGame };
