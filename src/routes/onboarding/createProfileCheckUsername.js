const express = require("express");
const router = express.Router();
const { client } = require("../../database/db");

router.get("/", async (req, res) => {
    const { username } = req.query;
    console.log(`arrivata richiesta username`);

    if (!username) {
        return res
            .status(400)
            .json({ available: false, error: "Username mancante" });
    }

    try {
        const result = await client.query(
            "SELECT 1 FROM users WHERE username = $1 LIMIT 1",
            [username]
        );

        const isTaken = result.rows.length > 0;
        return res.json({ available: !isTaken });
    } catch (err) {
        console.error("Errore nella verifica dello username:", err);
        return res
            .status(500)
            .json({ available: false, error: "Errore del server" });
    }
});

module.exports = router;
