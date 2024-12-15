const express = require('express');
const { userGameMap } = require('./queueRoutesNew');

const checkUserGameStatus = (req, res, next) => {
    const user_id = req.user_id;  // Ottenuto dal middleware `checkAuth`
    console.log(`Verifica stato di gioco per utente: ${user_id}`);
    console.log('Tipo di user_id:', typeof user_id);

    userGameMap.forEach((gameId, key) => {
        console.log(`Chiave nella Map: ${key} (tipo: ${typeof key}), valore (gameId): ${gameId} (tipo: ${typeof gameId})`);
    });

    if (userGameMap.has(user_id)) {
        const gameId = userGameMap.get(user_id);
        console.log(`Utente ${user_id} è in partita con gameId: ${gameId}`);
        req.isInGame = true;  // Indica che l'utente è in partita
        req.gameId = gameId;  // Associa il gameId alla richiesta
    } else {
        console.log(`Utente ${user_id} non è in una partita.`);
        req.isInGame = false;  // Indica che l'utente non è in partita
    }

    next(); // Passa al prossimo middleware o route handler
};

module.exports = checkUserGameStatus;

