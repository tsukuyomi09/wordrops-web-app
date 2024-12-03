const express = require('express');
const router = express.Router();
const { client } = require('../database/db'); 
const checkAuth = require('../middlewares/checkAuthToken');

router.get("/userProfileData/:username", checkAuth, async (req, res) => {
    try {
        const { username } = req.params; 
        if (!username) {
            return res.status(404).json({ error: "Username non trovato" });
        }
        const result = await client.query(
            'SELECT username, avatar, punteggio, capitoli_scritti FROM users WHERE username = $1',
            [username]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Utente non trovato" });
        }
        const { avatar, punteggio, capitoli_scritti } = result.rows[0];
        res.status(200).json({
            username,
            avatar: avatar || '/images/default-avatar.png',  // Usa un avatar di default se non presente
            punteggio: punteggio || 0,  // Se il punteggio non esiste, restituisci 0
            capitoli_scritti: capitoli_scritti || 0  // Se i capitoli scritti non esistono, restituisci 0
        });

    } catch (err) {
        console.error("Errore durante il recupero dei dati dell'utente:", err);
        res.status(500).json({ error: "Errore del server" });
    }
});

module.exports = router;
