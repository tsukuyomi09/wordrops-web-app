const { client } = require("../database/db");
const { generateBookMetadata } = require("../utils/textGeneratorAi");

async function saveNormalGame(game) {
    try {
        // generate book cover + book title using open ai
        const validChapters = game.chapters.filter(
            (chapter) =>
                chapter.content && chapter.content !== "[Tempo scaduto]"
        );
        const chaptersToElaborate = validChapters
            .map((chapter) => chapter.content)
            .join("\n");

        if (!chaptersToElaborate) {
            throw new Error("Non ci sono capitoli validi da elaborare.");
        }

        const aiResponse = await generateBookMetadata(chaptersToElaborate); // Passiamo solo i contenuti validi

        if (!aiResponse.title || !aiResponse.blurb) {
            throw new Error("Risposta AI non valida.");
        }

        const { title, blurb } = aiResponse;
        // 1️⃣ Salviamo il gioco nella tabella games_completed

        const finishedAt = new Date();
        const result = await client.query(
            `INSERT INTO games_completed (title, started_at, finished_at, mode, back_cover)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [title, game.startedAt, finishedAt, game.gameMode, blurb]
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
