const { Client } = require("pg");

const client = new Client({
    user: "postgres", // O il tuo nome utente
    host: "localhost",
    database: "insert_item_database",
    password: "834382", // Inserisci qui la tua password
    port: 5432,
});

const connectDB = async () => {
    try {
        await client.connect();
        console.log("Connesso al database");
    } catch (err) {
        console.error("Errore di connessione:", err.stack);
    }
};

// Esporta il client e la funzione di connessione
module.exports = { client, connectDB };