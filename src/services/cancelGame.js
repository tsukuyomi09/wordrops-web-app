const { client } = require("../database/db");
const { getSocket } = require("./socketManager");
const { activeGames } = require("../services/gameManager");
const { removeGameFromPlayers } = require("../utils/removeGameFromPlayers");

async function cancelGameAndSave(gameId) {
    const io = getSocket();

    const game = activeGames.get(gameId);

    if (!game) {
        console.log(`[cancelGame] Partita ${gameId} non trovata.`);
        return;
    }

    try {
        const finishedAt = new Date();

        // 1️⃣ Salviamo la partita annullata
        const result = await client.query(
            `INSERT INTO games_completed (started_at, finished_at, mode, publish, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [
                game.startedAt,
                finishedAt,
                game.gameMode,
                "cancelled",
                "cancelled",
            ]
        );

        const databaseGameId = result.rows[0].id;

        // 2️⃣ Salviamo tutti i capitoli scritti (se ci sono)
        if (game.chapters && game.chapters.length > 0) {
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
        }

        // 3️⃣ Emit a tutti nella stanza
        await new Promise((resolve, reject) => {
            try {
                io.to(gameId).emit("gameCanceled", {
                    reason: "La partita è stata annullata: troppi capitoli nulli.",
                    gameId,
                });
                // Risolviamo la promessa quando l'emit è stato eseguito
                resolve();
            } catch (error) {
                reject(error);
            }
        });

        removeGameFromPlayers(game);

        activeGames.delete(gameId);

        console.log(
            `[cancelGame] Partita ${gameId} annullata, salvata e notificata.`
        );
    } catch (err) {
        console.error(
            `[cancelGame] Errore durante la cancellazione della partita:`,
            err
        );
    }
}

module.exports = { cancelGameAndSave };
