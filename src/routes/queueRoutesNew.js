const express = require('express');
const router = express.Router();
const { createGameAndAssignPlayers } = require('../services/gameManager');
const { activeGames } = require('../services/gameManager');
const checkAuth = require('../middlewares/checkAuthToken');


let gameQueue = []; // Array per la coda dei giocatori
let preGameQueue = {}; // Oggetto per i giochi pronti
const userGameMap = new Map(); // status degli utenti  



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
    gameQueue.push({ id: userId, username, socketId, timestamp: Date.now(), pronto: null });
    const socket = req.io.sockets.sockets.get(socketId);
    if (socket) {
        setTimeout(() => {
            socket.emit('in-queue', 'In attesa di altri giocatori');
        }, 1000);
    } else {
        console.log(`Nessun socket trovato per ${username} con socketId ${socketId}`);
    }

    // Controlla se ci sono 5 giocatori nella coda
    if (gameQueue.length >= 5) {
        const players = gameQueue.splice(0, 5);
        let gameId = `game_${Date.now()}`;
        preGameQueue[gameId] = players; 

        players.forEach(player => {
            const socket = req.io.sockets.sockets.get(player.socketId);
            if (socket) {
                socket.join(gameId);
                socket.emit('gameIdAssigned', { gameId });
            } else {
                console.log(`Nessun socket trovato per ${player.username} con socketId ${player.socketId}`);
            }
        });
        setTimeout(() => {
            startCountdownPreGame(req.io, gameId);
        }, 3000);
    } 

    return res.status(200).json({ message: 'Utente aggiunto alla coda' });
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

    req.socket.emit("queueAbandoned", { 
        status: 'idle', 
        message: 'Hai abbandonato la coda' 
    });
    res.json({ status: 'idle', message: 'Utente rimosso dalla coda', gameQueue });
});


async function startCountdownPreGame(io, gameId) {
    let countdown = 10; 
    
    const preGameCountdownInterval = setInterval(async () => {
        io.to(gameId).emit('countdown', countdown); // Invia il countdown corrente

        if (countdown <= 0) { // Quando il countdown termina
            clearInterval(preGameCountdownInterval); // Ferma il countdown
            const game = preGameQueue[gameId]; // Recupera il gioco

            if (game) {
                const allReady = game.every(player => player.pronto); // Controlla se tutti sono pronti

                if (allReady) {
                    const { gameId: newGameId, turnOrder }  = await createGameAndAssignPlayers(game);

                    game.forEach(player => {
                        userGameMap.set(player.id, newGameId);
                    });

                    io.to(gameId).emit('game-start', {
                        message: "Tutti pronti: inizia il gioco",
                        gameId: newGameId,  // Passiamo il gameId al client
                        turnOrder: turnOrder
                    });

                } else {
                    io.to(gameId).emit('game-cancelled', "Non tutti i giocatori erano pronti, partita annullata"); // Rimuovi la coda del gioco dal server
                }
            }
        } else {
            countdown--; 
        }
    }, 1000);
}

module.exports = router;
module.exports.gameQueue = gameQueue;
module.exports.preGameQueue = preGameQueue;
module.exports.userGameMap = userGameMap;