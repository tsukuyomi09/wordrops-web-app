const express = require('express');
const router = express.Router();
const path = require('path');
const checkAuth = require('../middlewares/checkAuthToken');
const checkUserGameStatus = require('../routes/checkUserGameStatus');
const { activeGames } = require('../services/gameManager');

router.get('/game/:gameId', checkAuth, checkUserGameStatus, async (req, res) => {
    const { gameId: URLgameId } = req.params;  // Estrai e rinomina il gameId in URLgameId
    const { isInGame } = req;  
    const { gameId } = req;  

    if (isInGame && Number(URLgameId) === Number(gameId)) {
        const game = activeGames.get(Number(URLgameId));

        // Se il gioco non è in corso (status non è 'in-progress')
        if (game.status == 'to-start') {
            // Invio della pagina di gioco con il flag del popup
            res.sendFile(path.join(__dirname, '..', '..', 'views', 'game.html'), {
                popup: true // Indica al client che deve mostrare il popup
            });
        } else {
            // Se il gioco è in corso, invia solo la pagina senza il popup
            res.sendFile(path.join(__dirname, '..', '..', 'views', 'game.html'));
        }

        // Se il gioco è in corso, invia la pagina di gioco
        res.sendFile(path.join(__dirname, '..', '..', 'views', 'game.html'));
    } else {
        res.redirect(`/dashboard/${req.username}`);
    }
});

module.exports = router;