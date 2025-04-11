const express = require("express");
const router = express.Router();
const { client } = require("../database/db");
const path = require("path");

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
            // Token non valido, ritorna la pagina di errore
            return res.sendFile(
                path.join(__dirname, "../../views/verify-email-error.html")
            );
        }

        // Verifica del token riuscita, aggiorna l'utente
        await client.query(
            "UPDATE users SET verified = true, verification_token = NULL WHERE verification_token = $1",
            [token]
        );

        // Ritorna la pagina di successo
        return res.sendFile(
            path.join(__dirname, "../../views/verify-email-success.html")
        );
    } catch (err) {
        console.error("Errore nella verifica:", err);
        res.status(500).send("Errore del server");
    }
});

module.exports = router;
