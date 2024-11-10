const { client } = require("./database");

const checkSession = (req, res, next) => {
    const cookies = req.headers.cookie;
    const sessionId = cookies && cookies.split('; ').find(c => c.startsWith('sessionId=')).split('=')[1];

    if (!sessionId) {
        res.writeHead(401); // 400 Bad Request
        res.end("Sessione non valida o non presente.");
        return;
    }

    const sessionQuery = "SELECT user_id FROM sessions WHERE session_id = $1";

    client.query(sessionQuery, [sessionId])
        .then(result => {
            if (result.rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" }); // 404 Not Found
                res.end(JSON.stringify({ message: "Nessun oggetto trovato per questo utente" }));
                return;
            }

            // Aggiungi l'user_id alla richiesta
            req.user_id = result.rows[0].user_id;
            next(); // Continua la richiesta alla rotta successiva
        })
        .catch(err => {
            console.error("Errore durante il recupero della sessione:", err);
            res.writeHead(500);
            res.end("Errore del server");
        });
};

module.exports = checkSession;
