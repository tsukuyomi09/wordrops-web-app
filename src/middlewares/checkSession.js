const { client } = require('../database/db'); 

const checkSession = (req, res, next) => {
    // Estrai il sessionId dai cookies
    const cookies = req.headers.cookie;
    const sessionId = cookies && cookies.split('; ').find(c => c.startsWith('sessionId=')).split('=')[1];

    if (!sessionId) {
        return res.status(401).json({ message: "Sessione non valida o non presente." });
    }

    // Query per verificare la sessione nel database
    const sessionQuery = "SELECT user_id FROM sessions WHERE session_id = $1";

    client.query(sessionQuery, [sessionId])
        .then(result => {
            if (result.rows.length === 0) {
                return res.status(404).json({ message: "Sessione non trovata per questo utente." });
            }

            // Aggiungi l'user_id alla richiesta
            req.user_id = result.rows[0].user_id;
            next(); // Continua con la richiesta alla rotta successiva
        })
        .catch(err => {
            console.error("Errore durante il recupero della sessione:", err);
            return res.status(500).json({ message: "Errore del server" });
        });
};

module.exports = checkSession;
