const express = require("express");
const router = express.Router();
const { client } = require("../database/db");

router.get("/verify-email", async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: "Token mancante." });
    }

    try {
        const userResult = await client.query(
            "SELECT * FROM users WHERE verification_token = $1",
            [token]
        );

        if (userResult.rowCount === 0) {
            return res.status(400).send("Token non valido o già usato");
        }
        await client.query(
            "UPDATE users SET verified = true, verification_token = NULL WHERE verification_token = $1",
            [token]
        );
        res.send("Email verificata con successo! Ora puoi fare il login.");
    } catch (err) {
        console.error("Errore nella verifica:", err);
        res.status(500).send("Errore del server");
    }
});

module.exports = router;
