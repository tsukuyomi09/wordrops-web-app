const { client } = require("./database");


const checkQueue = (req, res,) => {
    const user_id = req.user_id; // Assicurati di avere il user_id correttamente
    if (!user_id) {
        // Se user_id non è disponibile, rispondi con un errore
        res.writeHead(400,  {'Content-Type': 'application/json' })
        res.end(JSON.stringify({ message: "ID utente non trovato. Utente non autenticato." }));
    }

    const checkQueueQuery = "SELECT * FROM queue WHERE user_id = $1";
    client.query(checkQueueQuery, [user_id])
        .then(result => {
            // Se l'utente è in coda (ovvero se la query restituisce una riga)
            if (result.rows.length > 0) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ inQueue: true })); // L'utente è in coda
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ inQueue: false })); // L'utente non è in coda
            }
        })}

const joinQueue = (req, res,) => {
    const user_id = req.user_id
    const checkQueueQuery = "SELECT * FROM queue WHERE user_id = $1";

    client.query(checkQueueQuery, [user_id])
    .then(queueResult => {
        if (queueResult.rows.length > 0) {
            // Se l'utente è già in coda
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "Sei già in coda per una partita." }));
            return;
        }

        // Aggiungi l'utente alla coda
        const addToQueueQuery = "INSERT INTO queue (user_id) VALUES ($1)";
        client.query(addToQueueQuery, [user_id])
            .then(() => {
                // Risposta di successo
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: "Sei stato aggiunto alla coda." }));
            })
            .catch(err => {
                console.error("Errore nell'aggiungere l'utente alla coda:", err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Errore nell'aggiungere alla coda." }));
            });
    })
    .catch(err => {
        console.error("Errore nel controllare la coda:", err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "Errore nel controllo della coda." }));
    });
};

const leaveQueue = (req, res,) => {
    const user_id = req.user_id
    const checkQueueQuery = "SELECT * FROM queue WHERE user_id = $1";

    client.query(checkQueueQuery, [user_id])
    .then(queueResult => {
        if (queueResult.rows.length === 0) {
            // Se l'utente è già in coda
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "Non sei in coda per una partita." }));
            return;
        }

        // Aggiungi l'utente alla coda
        const deleteToQueueQuery = "DELETE FROM queue WHERE user_id = ($1)";
        client.query(deleteToQueueQuery, [user_id])
            .then(() => {
                // Risposta di successo
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: "Sei stato aggiunto alla coda." }));
            })
            .catch(err => {
                console.error("Errore nell'aggiungere l'utente alla coda:", err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Errore nell'aggiungere alla coda." }));
            });
    })
    .catch(err => {
        console.error("Errore nel controllare la coda:", err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "Errore nel controllo della coda." }));
    });
};

function monitorQueue() {
    const countQuery = "SELECT COUNT(*) FROM queue";
    return client.query(countQuery)
        .then(result => {
            const playersWaitingInQueue = parseInt(result.rows[0].count, 10);
            console.log(`playersWaitingInQueue: ${playersWaitingInQueue}`)
            return playersWaitingInQueue;
        })
        .catch(err => {
            console.error("Errore nel monitoraggio della queue:", err);
            throw err;  // Riporta l'errore a chi chiama la funzione
        });
}


module.exports = { joinQueue, leaveQueue, checkQueue, monitorQueue };
