const { client } = require("./database");


const joinGame = (req, res) => {
    user_id = req.user_id;
    const checkAvailableGameQuery = `
    SELECT game_id 
    FROM games 
    WHERE status = 'waiting' AND game_id NOT IN (SELECT game_id FROM players_in_game GROUP BY game_id HAVING COUNT(*) >= 5)
    LIMIT 1`;
    client.query(checkAvailableGameQuery)
    .then(result => {
        if (result.rows.length > 0) {
                const game_id = result.rows[0].game_id;
                // Se esiste una partita con slot liberi
                addPlayerToGame(res, game_id, user_id);
            } else {
                // Se non ci sono partite disponibili, crea una nuova partita
                createNewGame(res, user_id);
            }
        })
        .catch(err => {
            console.error("Errore nel controllo delle partite:", err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "Errore nel controllo delle partite." }));
        });
}


const addPlayerToGame = ( res, game_id, user_id) => {
    // Prima verifica se la partita ha già 5 giocatori
    const checkPlayerCountQuery = `
        SELECT COUNT(*) 
        FROM players_in_game 
        WHERE game_id = $1
    `;

    client.query(checkPlayerCountQuery, [game_id])
        .then(result => {
            const playerCount = parseInt(result.rows[0].count);

            // Se ci sono già 5 giocatori, non aggiungere il nuovo giocatore
            if (playerCount >= 5) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "La partita ha già 5 giocatori." }));
                return;
            }

            // Aggiungi il giocatore alla partita
            const addToGameQuery = `
                INSERT INTO players_in_game (game_id, user_id, turn_order) 
                VALUES ($1, $2, (SELECT COALESCE(MAX(turn_order), 0) + 1 FROM players_in_game WHERE game_id = $1))
            `;
            client.query(addToGameQuery, [game_id, user_id])
                .then(() => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: "Sei stato aggiunto a una partita esistente.",
                    }));
                    // Verifica se la partita è pronta per partire
                    checkAndStartGame(res, game_id);
                })
                .catch(err => {
                    console.error("Errore nell'aggiungere il giocatore alla partita:", err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: "Errore nell'aggiungere alla partita." }));
                });
        })
        .catch(err => {
            console.error("Errore nel verificare il numero di giocatori:", err);
        });
};

const createNewGame = (res, user_id) => {
    const createGameQuery = "INSERT INTO games (status, started_at) VALUES ('waiting', NOW()) RETURNING game_id";
    client.query(createGameQuery)
        .then(result => {
            game_id = result.rows[0].game_id;

            // Aggiungi il giocatore alla nuova partita
            addPlayerToGame(res, game_id, user_id);
        })
        .catch(err => {
            console.error("Errore nella creazione della partita:", err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "Errore nella creazione della partita." }));
        });
};

const checkAndStartGame = (res, game_id) => {
    // Controlla quanti giocatori sono presenti nella partita
    const checkPlayerCountQuery = `
        SELECT COUNT(*) 
        FROM players_in_game 
        WHERE game_id = $1
    `;

    // Esegui la query per contare i giocatori
    client.query(checkPlayerCountQuery, [game_id])
        .then(result => {
            const playerCount = parseInt(result.rows[0].count);

            // Se ci sono esattamente 5 giocatori, la partita è pronta per partire
            if (playerCount === 5) {
                // Aggiorna lo stato della partita a "in progress"
                const updateGameStatusQuery = `
                    UPDATE games 
                    SET status = 'in progress', started_at = NOW() 
                    WHERE game_id = $1
                `;
                
                client.query(updateGameStatusQuery, [game_id])
                    .then(() => {
                        console.log("La partita è iniziata!");
                        // Puoi inviare una risposta o continuare con altre operazioni, se necessario
                    })
                    .catch(err => {
                        console.error("Errore nell'aggiornare lo stato della partita:", err);
                    });
            } else if (playerCount > 5) {
                // Se ci sono più di 5 giocatori (dovrebbe essere impossibile se la logica è corretta), invia un errore
                console.error(`Errore: La partita ${game_id} ha più di 5 giocatori!`);
            } else {
                console.log(`Sei in Coda.. in attesa di altri giocatori`);
                res.end(JSON.stringify({ inGame: true }));
            }
        })
        .catch(err => {
            console.error("Errore nel verificare il numero di giocatori:", err);
        });
};


const checkIfInGameQuery = (req, res) => {
    const user_id = req.user_id;
    const checkQuery = `SELECT 1 FROM players_in_game WHERE user_id = $1 LIMIT 1`;

    client.query(checkQuery, [user_id])
        .then(result => {
            if (result.rows.length > 0) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ inGame: true }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ inGame: false }));
            }
        })
        .catch(err => {
            console.error("Errore nel verificare la partita:", err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "Errore nel verificare lo stato della partita" }));
        });
}


module.exports = { joinGame, checkIfInGameQuery };
