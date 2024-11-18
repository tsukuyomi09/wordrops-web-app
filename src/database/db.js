const { Client } = require("pg");

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Necessario per Railway
    }
});

const connectDB = async () => {
    try {
        await client.connect();
        console.log('Connesso al database railway');
    } catch (err) {
        console.error('Errore di connessione:', err.stack);
    }
};

module.exports = { client, connectDB };

