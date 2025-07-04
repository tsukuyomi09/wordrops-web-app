const { notificationMap } = require("./notificationMap.js");
const { client } = require("../database/db");

async function loadNotificationsIntoMap() {
    try {
        const res = await client.query(
            `SELECT game_id, user_id, score, comment
            FROM notifications
            WHERE status = 'pending'`
        );

        res.rows.forEach(({ game_id, user_id, score, comment }) => {
            notificationMap.add(game_id, user_id, score, comment);
        });
    } catch (err) {
        console.error("Error loading notifications:", err);
    }
}

module.exports = { loadNotificationsIntoMap };
