const express = require('express');
const router = express.Router();
const { userGameMap } = require('./queueRoutesNew');
const checkAuth = require('../middlewares/checkAuthToken');

router.get('/checkUserGameStatus', checkAuth, (req, res) => {
    console.log(`richiesta ricevuta per controllare status utente`)
    const { user_id } = req;  // Estrai user_id direttamente da req (già impostato dal middleware)
    console.log(`utente id: ${user_id}`)

    // Controlliamo se l'utente è presente in userGameMap
    if (userGameMap.has(user_id)) {
        const gameId = userGameMap.get(user_id);
        return res.json({ isInGame: true, gameId });  // L'utente è in partita, ritorniamo il gameId
    } else {
        return res.json({ isInGame: false });  // L'utente non è in partita
    }
});

module.exports = router;
