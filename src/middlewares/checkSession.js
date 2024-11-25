const { client } = require('../database/db');

const checkSession = (req, res, next) => {
    // Estrai il sessionId dai cookies
    const cookies = req.headers.cookie;
    const sessionCookie = cookies && cookies.split('; ').find(c => c.startsWith('sessionId='));

    // Verifica se il sessionId è presente
    if (!sessionCookie) {
        return res.status(401).json({ sessionActive: false, message: "Sessione non valida o non presente." });
    }

    // Estrai il valore del sessionId
    const sessionId = sessionCookie.split('=')[1];

    // Query per verificare la sessione nel database
    const sessionQuery = "SELECT user_id FROM sessions WHERE session_id = $1";

    client.query(sessionQuery, [sessionId])
        .then(result => {
            // Verifica se il sessionId esiste nel database
            if (result.rows.length === 0) {
                return res.status(401).json({ sessionActive: false, message: "Sessione non valida o scaduta." });
            }

            // Aggiungi l'user_id alla richiesta per l'utilizzo successivo
            req.user_id = result.rows[0].user_id;

            // Passa al middleware o alla rotta successiva
            next();
        })
        .catch(err => {
            console.error("Errore durante il recupero della sessione:", err);
            return res.status(500).json({ message: "Errore del server" });
        });
};

module.exports = checkSession;
