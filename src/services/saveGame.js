const { client } = require("../database/db");

async function saveNormalGame(game) {
    try {
        // 1️⃣ Salviamo il gioco nella tabella games_completed
        const finishedAt = new Date();
        const result = await client.query(
            `INSERT INTO games_completed (title, started_at, finished_at)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [`Storia ${game.gameId}`, game.startedAt, finishedAt]
        );
        const databaseGameId = result.rows[0].id;

        // 2️⃣ Salviamo tutti i capitoli nella tabella games_chapters
        await Promise.all(
            game.chapters.map((chapter, index) => {
                return client.query(
                    `INSERT INTO games_chapters (game_id, title, content, author_id, turn_position, created_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                    [
                        databaseGameId,
                        chapter.title,
                        chapter.content,
                        chapter.user_id,
                        index + 1,
                    ]
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

        console.log("Game and chapters saved successfully!");
        return true;
    } catch (err) {
        console.error("Error saving game and chapters:", err);
        throw err;
    }
}

module.exports = { saveNormalGame };
