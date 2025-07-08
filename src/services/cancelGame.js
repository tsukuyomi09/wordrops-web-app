const { client } = require("../database/db");

async function cancelGameAndSave(game) {
    if (!game) {
        return;
    }

    try {
        const finishedAt = new Date();

        const result = await client.query(
            `INSERT INTO games_completed (started_at, finished_at, game_type, game_speed, publish, status, game_lang)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
                game.startedAt,
                finishedAt,
                game.gameType,
                game.gameSpeed,
                "cancelled",
                "cancelled",
                game.game_lang,
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
                    -10,
                ];

                return client.query(
                    `INSERT INTO games_chapters (game_id, title, content, author_id, turn_position, score, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                    chapterValues
                );
            })
        );
    } catch (err) {
        return {
            message: "An error occurred while deleting the game.",
        };
    }
}

module.exports = { cancelGameAndSave };
