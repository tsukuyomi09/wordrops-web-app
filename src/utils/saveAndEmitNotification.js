const { client } = require("../database/db");
const { getSocket } = require("../services/socketManager");

async function saveAndEmitNotification(game, databaseGameId) {
    const io = getSocket();
    await Promise.all(
        game.chapters.map(async (chapter) => {
            await client.query(
                `INSERT INTO notifications (user_id, game_id, score, comment, status)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    chapter.user_id,
                    databaseGameId,
                    chapter.points,
                    chapter.comment,
                    "pending",
                ]
            );
        })
    );
    io.to(`${game.gameId}`).emit("notification-new-ranked-score", {
        points: chapter.points,
        comment: chapter.comment,
        gameId: databaseGameId,
    });
}

module.exports = {
    saveAndEmitNotification,
};
