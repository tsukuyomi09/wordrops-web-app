const express = require('express');
const router = express.Router();
const { client } = require('../database/db'); 
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
        console.log(preGameQueue);
        setTimeout(() => {
            startCountdown(req.io, gameId);
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

    console.log('Coda aggiornata:', gameQueue);

    req.socket.emit("queueAbandoned", { 
        status: 'idle', 
        message: 'Hai abbandonato la coda' 
    });
    res.json({ status: 'idle', message: 'Utente rimosso dalla coda', gameQueue });
});


async function startCountdown(io, gameId) {
    let countdown = 10; 
    const countdownInterval = setInterval(async () => {
        io.to(gameId).emit('countdown', countdown); // Invia il countdown corrente

        if (countdown <= 0) { // Quando il countdown termina
            clearInterval(countdownInterval); // Ferma il countdown
            const game = preGameQueue[gameId]; // Recupera il gioco
            console.log(game)
            if (game) {
                const allReady = game.every(player => player.pronto); // Controlla se tutti sono pronti
                if (allReady) {
                    const newGameId = await createGameAndAssignPlayers(game); 
                    io.to(gameId).emit('game-start', {
                        message: "Tutti pronti: inizia il gioco",
                        gameId: newGameId  // Passiamo il gameId al client
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

async function createGameAndAssignPlayers( game ) {
    let newGameId;

    try {
        const result = await client.query(`
            INSERT INTO games (status, started_at) 
            VALUES ('in-progress', NOW()) 
            RETURNING game_id;`
        );

        newGameId = result.rows[0].game_id;

        const playerPromises = game.map(player => {
            return client.query(`
                INSERT INTO players_in_game (game_id, user_id) 
                VALUES ($1, $2)
                ON CONFLICT (game_id, user_id) DO NOTHING;`
                , [newGameId, player.id]);
        });

        const playerIds = game.map(player => player.id);
        await client.query(`
            UPDATE users 
            SET status = 'in_game'
            WHERE user_id = ANY($1);`,
            [playerIds]
        );

        //implement after creating game and players, update user status
    
        await Promise.all(playerPromises);
        return newGameId;

    } catch (err) {
        console.error("Errore durante la creazione del gioco e l'assegnazione dei giocatori:", err);
    }
}


module.exports = router;
module.exports.gameQueue = gameQueue;
module.exports.preGameQueue = preGameQueue;