const express = require("express");
const router = express.Router();
const { client } = require("../../database/db");

router.get("/", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    try {
        const result = await client.query(
            `SELECT u.username, u.avatar, us.ranked_score
            FROM user_statistics us
            JOIN users u ON us.user_id = u.user_id
            ORDER BY us.ranked_score DESC
            LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({ users: result.rows });
    } catch (err) {
        console.error("Errore nella leaderboard:", err);
        res.status(500).json({ error: "Errore interno del server" });
    }
});

module.exports = router;
