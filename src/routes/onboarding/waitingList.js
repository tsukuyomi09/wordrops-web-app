const express = require("express");
const router = express.Router();
const { client } = require("../../database/db");
const { sendWaitingListEmail } = require("../../utils/waitingListEmail");

router.post("/", async (req, res) => {
    const {
        waitingListName,
        waitingListEmail,
        waitingListpreferences,
        waitingListGender,
        waitingListAge,
    } = req.body;

    // Controlla che tutti i campi siano presenti
    if (
        !waitingListName ||
        !waitingListEmail ||
        !waitingListpreferences | !waitingListGender | !waitingListAge
    ) {
        return res
            .status(400)
            .json({ message: "Tutti i campi sono richiesti." });
    }

    try {
        // Inserimento dei dati nel database
        const query =
            "INSERT INTO waiting_list (name, email, preferences, gender, age_range, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *";
        const result = await client.query(query, [
            waitingListName,
            waitingListEmail,
            waitingListpreferences,
            waitingListGender,
            waitingListAge,
        ]);

        // Invia una mail di benvenuto
        sendWaitingListEmail(waitingListEmail, waitingListName);

        // Risposta con i dati dell'utente registrato
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Errore durante l'inserimento nel database.",
        });
    }
});

module.exports = router;
