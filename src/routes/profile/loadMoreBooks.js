const express = require("express");
const router = express.Router();
const { client } = require("../../database/db");
const { loadProfileBooks } = require("../../utils/loadProfileBooks");

router.get("/:username", async (req, res) => {
    const { username } = req.params;
    const limit = 1;
    const offset = parseInt(req.query.offset) || 0;

    try {
        const result = await client.query(
            `SELECT user_id FROM users WHERE username = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Utente non trovato" });
        }

        const user_id = result.rows[0].user_id;

        const games = await loadProfileBooks(user_id, limit, offset);

        res.json({ games }); // 👈 solo questo, niente stats/avatar
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Errore del server" });
    }
});

module.exports = router;
