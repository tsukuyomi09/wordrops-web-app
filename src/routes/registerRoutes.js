const express = require('express');
const path = require('path');
const router = express.Router();
const { client } = require('../database/db'); 
const { sendWelcomeEmail } = require('../utils/registration-email');  
const argon2 = require('argon2');

router.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"))
})

router.post("/register", async (req, res) => {
    const { userEmail, userPassword, userName } = req.body;

    // Controlla che tutti i campi siano presenti
    if (!userName || !userEmail || !userPassword) {
        return res.status(400).json({ message: "Tutti i campi sono richiesti." });
    }

    let hashedPassword;
    try {
        // Hash della password
        hashedPassword = await argon2.hash(userPassword, {
            type: argon2.argon2id,
            memoryCost: 19456,
            timeCost: 2,
            parallelism: 1,
        });
    } catch (err) {
        console.error("Errore durante hashing della password");
        return res.status(500).json({ message: "Errore durante la registrazione." });
    }

    try {
        // Inserimento dei dati nel database
        const query = "INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING *";
        const result = await client.query(query, [userEmail, hashedPassword, userName]);

        // Invia una mail di benvenuto
        sendWelcomeEmail(userEmail, userName);

        // Risposta con i dati dell'utente registrato
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Errore durante l'inserimento nel database", err);
        if (err.code === "23505") {
            return res.status(400).json({ message: "L'email o il nome utente sono già in uso." });
        } else {
            return res.status(500).json({ message: "Errore del server." });
        }
    }
});

module.exports = router;
