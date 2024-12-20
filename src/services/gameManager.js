const { client } = require('../database/db'); 
const { getSocket } = require('./socketManager');


const activeGames = new Map(); 

async function createGameAndAssignPlayers(game) {
    let newGameId;

    try {
        // Creazione del gioco nel database
        const result = await client.query(`
            INSERT INTO games (status, started_at) 
            VALUES ('in-progress', NOW()) 
            RETURNING game_id;
        `);

        newGameId = result.rows[0].game_id;

        // Aggiunta dei giocatori alla partita
        const playerPromises = game.map(player => {
            return client.query(`
                INSERT INTO players_in_game (game_id, user_id) 
                VALUES ($1, $2)
                ON CONFLICT (game_id, user_id) DO NOTHING;
            `, [newGameId, player.id]);
        });

        const playerIds = game.map(player => player.id);
        await client.query(`
            UPDATE users 
            SET status = 'in_game'
            WHERE user_id = ANY($1);
        `, [playerIds]);

        // Aspettiamo che tutti i giocatori siano assegnati
        await Promise.all(playerPromises);

        const turnOrder = shuffleArray(game.map(player => ({
            id: player.id,
            username: player.username,
            avatar: player.avatar // Assicurati che l'avatar sia presente
        })));

        // Aggiungiamo il gioco alla mappa dei giochi attivi sul server
        activeGames.set(newGameId, {
            gameId: newGameId,
            players: game,
            chapters: [],
            status: 'to-start',
            turnOrder: turnOrder,
            readyPlayersCount: 0,
            turnIndex: 0,
            connections: [],
            countdownDuration: 1800000, // 30 minutes
            countdownStart: null,    // Valore iniziale
            countdownEnd: null,      // Sarà calcolato al momento dell'avvio
            startedAt: new Date()
        });

        console.log("Active Games - Full Log after adding the game:", JSON.stringify(Array.from(activeGames.entries()), null, 2));

        return { gameId: newGameId, turnOrder };

    } catch (err) {
        console.error("Errore nella creazione del gioco:", err);
        throw err;
    }
}

// get players and creare a random turn order
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Scambia gli elementi
    }
    return array;
}

function getActiveGames() {
    return activeGames;
}

function startCountdown(newGameId) {
    const io = getSocket();
    const game = activeGames.get(Number(newGameId));
    if (!game) {
        console.error(`Gioco con ID ${newGameId} non trovato`);
        return;
    }

    const now = Date.now();
    game.countdownStart = now;
    game.countdownEnd = now + game.countdownDuration;

    setInterval(() => {
        const remainingTime = game.countdownEnd - Date.now();
        if (remainingTime <= 0) {
            console.log(`Countdown terminato per il gioco ${newGameId}`);
            game.status = 'ready-to-start'; // Cambia stato o esegui altra logica
        } else {
            const minutes = Math.floor(remainingTime / 60000);
            const seconds = Math.floor((remainingTime % 60000) / 1000);
            io.in(Number(newGameId)).emit('gameUpdate', { 
                remainingTime,
                formatted: `${minutes}m ${seconds}s`,
            });
        }
    }, 1000); // Aggiorna ogni secondo
}




module.exports = { createGameAndAssignPlayers, activeGames, getActiveGames, startCountdown };
