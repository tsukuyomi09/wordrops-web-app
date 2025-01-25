const { client } = require("../database/db");

async function saveNormalGame(game) {
    try {
        // Fase 1: Completamento del gioco
        const finishedAt = new Date(); // La data di fine del gioco è la data corrente

        // Inseriamo il gioco nella tabella games_completed
        await client.query(
            `INSERT INTO games_completed (id, title, started_at, finished_at)
             VALUES ($1, $2, $3, $4)`,
            [game.gameId, `Storia ${game.gameId}`, game.startedAt, finishedAt] // Aggiungi il titolo "Storia + gameId"
        );

        // Fase 2: Salvataggio dei capitoli
        for (let i = 0; i < game.chapters.length; i++) {
            const chapter = game.chapters[i];

            // Inseriamo ogni capitolo nella tabella games_chapters
            await client.query(
                `INSERT INTO games_chapters (game_id, title, content, author_id, turn_position, created_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                [
                    game.gameId,
                    chapter.title,
                    chapter.content,
                    chapter.user_id,
                    i + 1,
                ]
            );
        }
        console.log("Game and chapters saved successfully!");
        return true;
    } catch (err) {
        console.error("Error saving game and chapters:", err);
        throw err; // Propaghiamo l'errore, se necessario
    }
}

module.exports = { saveNormalGame };
