const express = require("express");
const router = express.Router();
const { client } = require("../../database/db");

router.post("/", async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username mancante" });

    try {
        const userCheck = await client.query(
            `SELECT user_id FROM users WHERE username = $1`,
            [username]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "Utente non trovato" });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("Errore nel controllo username:", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});

router.post("/", async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username mancante" });

    try {
        const userCheck = await client.query(
            `SELECT user_id FROM users WHERE username = $1`,
            [username]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "Utente non trovato" });
        }

        const user_id = userCheck.rows[0].user_id;

        const rank = await client.query(
            `SELECT COUNT(*) + 1 AS rank
             FROM user_statistics
             WHERE ranked_score > (
                 SELECT ranked_score FROM users u
                 JOIN user_statistics us ON u.user_id = us.user_id
                 WHERE u.user_id = $1
             )`,
            [user_id]
        );

        const stats = await client.query(
            `SELECT 
                u.username,
                u.avatar,
                us.classic_played,
                us.ranked_played,
                us.stories_abandoned,
                us.ranked_score,
                us.perfect_performances,
                us.worst_performances
            FROM users u
            JOIN user_statistics us ON u.user_id = us.user_id
            WHERE u.user_id = $1`,
            [user_id]
        );

        const userGames = await client.query(
            `SELECT 
                gc.title,
                gc.game_type,
                gc.game_speed
            FROM game_players gp
            JOIN games_completed gc ON gp.game_uuid = gc.game_uuid
            WHERE gp.user_id = $1
            ORDER BY gc.finished_at DESC
            LIMIT 5
            `,
            [user_id]
        );

        const rankRow = rank.rows[0];
        const statsRow = stats.rows[0];
        const userGamesRow = userGames.rows[0];

        console.log(rankRow, statsRow, userGamesRow);
        console.log("userGames.rows.length", userGames.rows.length);

        res.json({
            rank: rankRow.rank,
            stats: statsRow,
            games: userGames.rows.length > 0 ? userGames.rows : [],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Errore server" });
    }
});

module.exports = router;
