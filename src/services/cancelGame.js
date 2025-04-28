const { client } = require("../database/db");

async function cancelGameAndSave(game) {
    if (!game) {
        console.log(`[cancelGame] Partita non trovata.`);
        return;
    }

    try {
        const finishedAt = new Date();

        const result = await client.query(
            `INSERT INTO games_completed (started_at, finished_at, game_type, game_speed, publish, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [
                game.startedAt,
                finishedAt,
                game.gameType,
                game.gameSpeed,
                "cancelled",
                "cancelled",
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

        console.log(`[cancelGame] Partita annullata, salvata e notificata.`);
    } catch (err) {
        console.error(
            `[cancelGame] Errore durante la cancellazione della partita:`,
            err
        );
    }
}

module.exports = { cancelGameAndSave };
