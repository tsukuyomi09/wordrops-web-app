const express = require("express");
const router = express.Router();
const { client } = require("../../database/db");

router.post("/", async (req, res) => {
    const { username } = req.body;
    console.log(username);
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

module.exports = router;
