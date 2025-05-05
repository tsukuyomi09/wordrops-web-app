const express = require("express");
const router = express.Router();
const { client } = require("../../database/db");
const path = require("path");

router.get("/", async (req, res) => {
    console.log("Richiesta ricevuta per la verifica dell'email");

    const { token } = req.query;
    console.log(`il token ${token}`);

    if (!token) {
        return res.status(400).json({ message: "Token mancante." });
    }

    try {
        const userResult = await client.query(
            "SELECT * FROM users WHERE verification_token = $1",
            [token]
        );

        if (userResult.rowCount === 0) {
            return res.sendFile(
                path.join(__dirname, "../../../views/verify-email-error.html")
            );
        }

        await client.query(
            "UPDATE users SET verified = true, verification_token = NULL WHERE verification_token = $1",
            [token]
        );

        return res.sendFile(
            path.join(__dirname, "../../../views/verify-email-success.html")
        );
    } catch (err) {
        console.error("Errore nella verifica:", err);
        res.status(500).send("Errore del server");
    }
});

module.exports = router;
