const express = require("express");
const router = express.Router();
const { client } = require("../../database/db");

router.get("/:story_id", async (req, res) => {
    const story_id = req.params.story_id;
    console.log("Ricevuto uuid:", story_id);

    try {
        const result = await client.query(
            "SELECT title FROM games_completed WHERE id = $1",
            [story_id]
        );

        console.log("Risultato query:", result.rows);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Storia non trovata" });
        }

        const { title } = result.rows[0];
        res.json({ title });
    } catch (error) {
        console.error("Errore nel recupero dati storia:", error);
        res.status(500).json({ error: "Errore interno del server" });
    }
});

module.exports = router;
