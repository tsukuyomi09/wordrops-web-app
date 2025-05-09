const express = require("express");
const router = express.Router();
const { client } = require("../../database/db");

router.post("/", async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username mancante" });

    try {
        const result = await client.query(
            `SELECT COUNT(*) + 1 AS rank
             FROM user_statistics
             WHERE ranked_score > (
                 SELECT ranked_score FROM users u
                 JOIN user_statistics us ON u.user_id = us.user_id
                 WHERE u.username = $1
             )`,
            [username]
        );

        const row = result.rows[0];
        console.log(row);
        if (!row) return res.status(404).json({ error: "Utente non trovato" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Errore server" });
    }
});

module.exports = router;
