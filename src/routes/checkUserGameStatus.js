const express = require('express');
const { userGameMap } = require('./queueRoutesNew');

const checkUserGameStatus = (req, res, next) => {
    const user_id = req.user_id;  // Ottenuto dal middleware `checkAuth`

    if (userGameMap.has(user_id)) {
        const gameId = userGameMap.get(user_id);
        req.isInGame = true;  // Indica che l'utente è in partita
        req.gameId = gameId;  // Associa il gameId alla richiesta
    } else {
        console.log(`Utente ${user_id} non è in una partita.`);
        req.isInGame = false;  // Indica che l'utente non è in partita
    }

    next(); // Passa al prossimo middleware o route handler
};

module.exports = checkUserGameStatus;

