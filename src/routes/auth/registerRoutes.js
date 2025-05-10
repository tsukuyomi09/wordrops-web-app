const express = require("express");
const path = require("path");
const router = express.Router();
const { client } = require("../../database/db");
const { sendRegistrationEmail } = require("../../utils/registration-email");
const argon2 = require("argon2");
const crypto = require("crypto");

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

router.post("/", async (req, res) => {
    const { userEmail, userPassword } = req.body;

    if (!userEmail || !userPassword) {
        return res
            .status(400)
            .json({ message: "Tutti i campi sono richiesti." });
    }

    let hashedPassword;
    try {
        hashedPassword = await argon2.hash(userPassword, {
            type: argon2.argon2id,
            memoryCost: 19456,
            timeCost: 2,
            parallelism: 1,
        });
    } catch (err) {
        console.error("Errore durante hashing della password");
        return res
            .status(500)
            .json({ message: "Errore durante la registrazione." });
    }

    try {
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const query =
            "INSERT INTO users (email, password, username, verification_token) VALUES ($1, $2, $3, $4) RETURNING *";
        const result = await client.query(query, [
            userEmail,
            hashedPassword,
            null,
            verificationToken,
        ]);

        sendRegistrationEmail(userEmail, verificationToken);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Errore durante l'inserimento nel database", err);
        if (err.code === "23505") {
            return res.status(400).json({ message: "L'email e già in uso." });
        } else {
            return res.status(500).json({ message: "Errore del server." });
        }
    }
});

module.exports = router;
