const { Client } = require("pg");
require("dotenv").config(); // Carica le variabili d'ambiente da .env in locale

// Configura il client
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Funzione per connettersi al DB
const connectDB = async () => {
    try {
        await client.connect();
        console.log('Connesso al database');
        const res = await client.query('SELECT NOW()');
        console.log('Data e ora dal database:', res.rows[0]);
    } catch (err) {
        console.error('Errore di connessione:', err.stack);
    }
};

module.exports = { client, connectDB };
