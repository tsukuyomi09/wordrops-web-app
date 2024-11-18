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
        const res = await client.query('SELECT NOW()');
        console.log('Data e ora dal database:', res.rows[0]);
    } catch (err) {
        
        console.error('Errore di connessione:', err.stack);
    }
};

module.exports = { client, connectDB };

