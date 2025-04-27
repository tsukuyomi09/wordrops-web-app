const { generateFullMetadata } = require("../utils/textGeneratorAi");
const { calculateAndAssignRatings } = require("./calculateAndAssignRatings");
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
            console.log("Chapters with ratings:", game.chapters);
        }

        const finishedAt = new Date();
        const result = await client.query(
            `INSERT INTO games_completed (title, started_at, finished_at, game_type, game_speed, back_cover, publish, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [
                metadata.title,
                game.startedAt,
                finishedAt,
                game.gameType,
                game.gameSpeed,
                metadata.backCover,
                "publish",
                "completed",
            ]
        );
        const databaseGameId = result.rows[0].id;

        // 2️⃣ Salviamo tutti i capitoli nella tabella games_chapters
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

        // 3️⃣ Filtriamo gli utenti con capitoli validi
        const validUserIds = [
            ...new Set(
                game.chapters
                    .filter((chapter) => chapter.isValid)
                    .map((chapter) => chapter.user_id)
            ),
        ];

        // 4️⃣ Aggiorniamo il conteggio dei capitoli scritti solo per gli utenti coinvolti
        if (validUserIds.length > 0) {
            await client.query(
                `UPDATE users SET capitoli_scritti = capitoli_scritti + 1
                 WHERE user_id = ANY($1)`,
                [validUserIds]
            );
        }

        await Promise.all(
            metadata.genres.map((genreId) => {
                return client.query(
                    `INSERT INTO game_genres (game_id, genre_id) VALUES ($1, $2)`,
                    [databaseGameId, genreId]
                );
            })
        );

        console.log("Game and chapters saved successfully!");
        return true;
    } catch (err) {
        console.error("Error saving game and chapters:", err);
        throw err;
    }
}

module.exports = { saveGame };
