const express = require('express');
const router = express.Router();
const path = require('path');
const checkAuth = require('../middlewares/checkAuthToken');
const { client } = require('../database/db'); 
const checkUserStatus = require('../middlewares/checkUserStatus');

router.get('/dashboard/:username', checkAuth, checkUserStatus, async (req, res) => {
    const { username } = req.params;  
    console.log(`Username nell'URL: ${username}`);
    console.log(`ID utente autenticato: ${req.user_id} (${req.username})`);

    try {
        if (username !== req.username) {
            return res.status(403).send("Non puoi visualizzare la dashboard di un altro utente.");
        }
        const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(404).send('Utente non trovato');
        }
        res.sendFile(path.join(__dirname, '..', '..', 'views', 'dashboard.html'));

    } catch (err) {
        console.error('Errore nel recupero dei dati dell\'utente:', err);
        res.status(500).send('Errore nel server');
    }
});

module.exports = router;