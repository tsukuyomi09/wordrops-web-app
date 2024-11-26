const express = require('express');
const router = express.Router();
const checkAuth = require('../middlewares/checkAuthToken');


let gameQueue = []; // Array per la coda dei giocatori
let preGameQueue = {}; // Oggetto per i giochi pronti

// add player to queue
router.post('/gamequeueNew', checkAuth, (req, res) => {
    const userId = req.user_id; // Ottieni userId dal middleware
    const username = req.username; // Ottieni username dal middleware
    const socketId = req.body.socketId;

    if (!userId) {
        return res.status(401).json({ error: 'Utente non autenticato' });
    }

    // Controlla se l'utente è già nella queue
    if (gameQueue.some(player => player.id === userId)) {
        return res.status(400).json({ error: 'Utente già in coda' });
    }

    // Aggiungi l'utente alla gameQueue con un timestamp
    gameQueue.push({ id: userId, username, socketId, timestamp: Date.now() });
    console.log('Stato aggiornato della gameQueue:', gameQueue);

    // Controlla se ci sono 5 giocatori nella coda
    if (gameQueue.length >= 5) {
        const players = gameQueue.splice(0, 5);
        let gameId = `game_${Date.now()}`;
        preGameQueue[gameId] = players; 

        players.forEach(player => {
            const socket = req.io.sockets.sockets.get(player.socketId);
            if (socket) {
                socket.join(gameId);
            } else {
                console.log(`Nessun socket trovato per ${player.username} con socketId ${player.socketId}`);
            }
        });
        req.io.to(gameId).emit('game-ready', 'Pronti alla partita!');
    } else {
        res.json({ status: 'in-queue', message: 'In attesa di altri giocatori', gameQueue });
    }

});


// remove player from queue
router.delete("/gamequeueNew", checkAuth, async (req, res) => {
    const userId = req.user_id; // Ottieni l'ID dell'utente dalla sessione

    // Trova l'indice dell'utente nella queue
    const playerIndex = gameQueue.findIndex(player => player.id === userId);

    if (playerIndex === -1) {
        return res.status(400).json({ error: 'Utente non trovato nella coda' });
    }
    // Rimuovi l'utente dalla queue
    gameQueue.splice(playerIndex, 1);

    console.log('Coda aggiornata:', gameQueue);
    res.json({ status: 'idle', message: 'Utente rimosso dalla coda', gameQueue });
});


module.exports = router;
module.exports.gameQueue = gameQueue;
module.exports.preGameQueue = preGameQueue;