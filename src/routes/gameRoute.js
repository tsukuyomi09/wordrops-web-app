const express = require('express');
const router = express.Router();
const path = require('path');
const checkAuth = require('../middlewares/checkAuthToken');
const checkUserGameStatus = require('../routes/checkUserGameStatus');

router.get('/game/:gameId', checkAuth, checkUserGameStatus, async (req, res) => {
    console.log(`Parametri URL: `, req.params);  // Visualizza l'oggetto params
    const { gameId: URLgameId } = req.params;  // Estrai e rinomina il gameId in URLgameId
    const { isInGame } = req;  
    const { gameId } = req;  
    console.log(`urlgameID: ${URLgameId}`);  // Visualizza il valore di gameId dalla URL
    console.log(`gameId: ${gameId}`);  // Visualizza il gameId dell'utente

    if (isInGame && Number(URLgameId) === Number(gameId)) {
        res.sendFile(path.join(__dirname, '..', '..', 'views', 'game.html'));
    } else {
        res.redirect(`/dashboard/${req.username}`);
    }
});

module.exports = router;