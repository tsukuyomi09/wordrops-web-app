const { generateFullMetadata } = require("../utils/textGeneratorAi");

async function saveNormalGame(game) {
    try {
        const gameMode = game.mode;
        const validChapters = game.chapters.filter(
            (chapter) =>
                chapter.content &&
                chapter.content.trim() !== "" &&
                chapter.content !== "[Tempo scaduto]"
        );

        console.log("Valid Chapters:", validChapters);

        const chaptersToElaborate = validChapters.map((chapter, index) => ({
            title: chapter.title,
            content: chapter.content,
        }));

        // Log per verificare il formato finale dei capitoli da elaborare
        console.log("Chapters to Elaborate:", chaptersToElaborate);

        const metadata = await generateFullMetadata(chaptersToElaborate);

        if (
            !metadata.title ||
            !metadata.blurb ||
            !metadata.genres ||
            !metadata.chapterRatings
        ) {
            throw new Error("Dati AI incompleti.");
        }
        console.log("Dati ricevuti dall'AI:", metadata);

        // const isRanked = ["ranked_slow", "ranked_fast"].includes(game.gameMode);
        // game.publishStatus = isRanked ? "awaiting_scores" : "publish";
        // game.status = isRanked ? "awaiting_scores" : "completed";

        // const finishedAt = new Date();
        // const result = await client.query(
        //     `INSERT INTO games_completed (title, started_at, finished_at, mode, back_cover, publish, status)
        //      VALUES ($1, $2, $3, $4, $5, $6, $7)
        //      RETURNING id`,
        //     [
        //         title,
        //         game.startedAt,
        //         finishedAt,
        //         game.gameMode,
        //         blurb,
        //         game.publishStatus,
        //         game.status,
        //     ]
        // );
        // const databaseGameId = result.rows[0].id;

        // // 2️⃣ Salviamo tutti i capitoli nella tabella games_chapters
        // await Promise.all(
        //     game.chapters.map((chapter, index) => {
        //         return client.query(
        //             `INSERT INTO games_chapters (game_id, title, content, author_id, turn_position, created_at)
        //          VALUES ($1, $2, $3, $4, $5, NOW())`,
        //             [
        //                 databaseGameId,
        //                 chapter.title,
        //                 chapter.content,
        //                 chapter.user_id,
        //                 index + 1,
        //             ]
        //         );
        //     })
        // );

        // // 3️⃣ Filtriamo gli utenti con capitoli validi
        // const validUserIds = [
        //     ...new Set(
        //         game.chapters
        //             .filter((chapter) => chapter.isValid)
        //             .map((chapter) => chapter.user_id)
        //     ),
        // ];

        // // 4️⃣ Aggiorniamo il conteggio dei capitoli scritti solo per gli utenti coinvolti
        // if (validUserIds.length > 0) {
        //     await client.query(
        //         `UPDATE users SET capitoli_scritti = capitoli_scritti + 1
        //          WHERE user_id = ANY($1)`,
        //         [validUserIds]
        //     );
        // }

        console.log("Game and chapters saved successfully!");
        return true;
    } catch (err) {
        console.error("Error saving game and chapters:", err);
        throw err;
    }
}

module.exports = { saveNormalGame };
