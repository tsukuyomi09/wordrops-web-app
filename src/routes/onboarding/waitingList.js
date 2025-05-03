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
        const query =
            "INSERT INTO waiting_list (name, email, preferences, gender, age_range, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *";
        const result = await client.query(query, [
            waitingListName,
            waitingListEmail,
            waitingListpreferences,
            waitingListGender,
            waitingListAge,
        ]);

        sendWaitingListEmail(waitingListEmail, waitingListName);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Errore durante l'inserimento nel database.",
        });
    }
});

module.exports = router;
