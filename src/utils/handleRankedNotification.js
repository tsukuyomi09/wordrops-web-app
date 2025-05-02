const { client } = require("../database/db");
const { notificationMap } = require("../services/notificationMap");

async function saveRankedNotification(chapters, databaseGameId) {
    await Promise.all(
        chapters.map(async (chapter) => {
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
            notificationMap.add(
                databaseGameId,
                chapter.user_id,
                chapter.points,
                chapter.comment
            );
        })
    );
}

async function removeRankedNotification(user_id, game_id) {
    try {
        await client.query(
            `DELETE FROM notifications WHERE user_id = $1 AND game_id = $2`,
            [user_id, game_id]
        );
        notificationMap.remove(game_id, user_id);
    } catch (error) {
        console.error(
            "Errore durante la rimozione della notifica dal DB",
            error
        );
    }
}

module.exports = {
    saveRankedNotification,
    removeRankedNotification,
};
