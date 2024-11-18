const { client } = require('../database/db'); 
const crypto = require("crypto");

async function createLoginSession(user_id) {
    const sessionId = await createSession(user_id);
    return sessionId;
}

const generateSessionId = () => {
    return crypto.randomBytes(16).toString("hex") + Date.now().toString(36);
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



module.exports = { createLoginSession, createSession };
