const { client } = require('../database/db'); 

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

        const turnOrder = shuffleArray(game.map(player => player.id));

        // Aggiungiamo il gioco alla mappa dei giochi attivi sul server
        activeGames.set(newGameId, {
            gameId: newGameId,
            players: game,
            status: 'in-progress',
            turnOrder: turnOrder,
            connections: game.map(player => player.socket),
            startedAt: new Date()
        });

        console.log("[DEBUG] Contenuto completo di activeGames:");
        activeGames.forEach((value, key) => {
            console.log(`- gameId: ${key}`);
            console.log(`  - players: ${value.players.map(player => player.id).join(", ")}`);
            console.log(`  - status: ${value.status}`);
            console.log(`  - turnOrder: ${value.turnOrder.join(", ")}`);
            console.log(`  - connections: ${JSON.stringify(value.connections, null, 2)}`);
            console.log(`  - startedAt: ${value.startedAt}`);
        });

        console.log(`Gioco con ID ${newGameId} creato e aggiunto ai giochi attivi.`);

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

module.exports = { createGameAndAssignPlayers, activeGames };
