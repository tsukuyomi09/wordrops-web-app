const express = require('express');
const router = express.Router();
const { client } = require('../database/db');
const checkSession = require('../middlewares/checkSession');

router.delete("/logout", checkSession, async (req, res) => {
    try {
        const user_id = req.user_id; // Supponiamo che checkSession abbia settato questo valore

        // Query per eliminare la sessione nel database
        const query = `DELETE FROM sessions WHERE user_id = $1`;
        const result = await client.query(query, [user_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Utente non trovato" });
        }

        // Impostazione del cookie vuoto per rimuoverlo
        res.clearCookie('sessionId');
        // Risposta di successo
        res.status(200).json({ message: "Logout effettuato con successo" });

    } catch (err) {
        console.error("Errore durante il logout:", err);
        res.status(500).json({ error: "Errore del server" });
    }
});

module.exports = router;
