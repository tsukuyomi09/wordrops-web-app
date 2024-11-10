const { client } = require("./database");

const generateSessionId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const createSession = async (user_id) => {
    const sessionId = generateSessionId();
    console.log(sessionId);
    const query = "INSERT INTO sessions (session_id, user_id, expires_at, created_at) VALUES ($1, $2, NOW() + INTERVAL '10 days', NOW()) RETURNING *";
    try {
        const result = await client.query(query, [sessionId, user_id]);
        return sessionId; // Restituisci sessionId solo dopo che la query è completata
    } catch (err) {
        console.error("Errore durante l'inserimento:", err);
        throw err; // Rilancia l'errore se qualcosa va storto
    }
};


module.exports = { createSession};