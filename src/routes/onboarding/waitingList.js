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
        language,
    } = req.body;

    if (
        !waitingListName ||
        !waitingListEmail ||
        !waitingListpreferences ||
        !waitingListGender ||
        !waitingListAge ||
        !language
    ) {
        return res
            .status(400)
            .json({ message: "Tutti i campi sono richiesti." });
    }

    try {
        const query =
            "INSERT INTO waiting_list (name, email, preferences, gender, age_range, language, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *";
        const result = await client.query(query, [
            waitingListName,
            waitingListEmail,
            waitingListpreferences,
            waitingListGender,
            waitingListAge,
            language,
        ]);

        sendWaitingListEmail(waitingListEmail, waitingListName, language);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (
            error.code === "23505" &&
            error.constraint === "waiting_list_email_key"
        ) {
            return res.status(409).json({
                // 409 Conflict è un codice HTTP appropriato per questo scenario
                message:
                    "Questo indirizzo email è già registrato come beta tester.",
                code: "DUPLICATE_EMAIL", // Un codice personalizzato per il client
            });
        } else {
            // Per tutti gli altri errori
            return res.status(500).json({
                message:
                    "Si è verificato un errore inatteso durante la registrazione. Riprova più tardi.",
                code: "SERVER_ERROR", // Un codice personalizzato per il client
            });
        }
    }
});

module.exports = router;
