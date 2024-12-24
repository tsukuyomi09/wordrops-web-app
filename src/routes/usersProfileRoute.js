const express = require('express');
const router = express.Router();
const path = require('path');
const checkAuth = require('../middlewares/checkAuthToken');
const checkUserGameStatus = require('../routes/checkUserGameStatus');

router.get('/profile/:username', checkAuth, checkUserGameStatus, async (req, res) => {
    try {
        // Invia direttamente la pagina del profilo, senza recuperare i dati dal database
        res.sendFile(path.join(__dirname, '..', '..', 'views', 'profile.html'));

    } catch (err) {
        console.error('Errore nel recupero della pagina del profilo:', err);
        res.status(500).send('Errore interno del server');
    }
});


module.exports = router;



