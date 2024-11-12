const { client } = require("./database");


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


module.exports = { joinQueue };
