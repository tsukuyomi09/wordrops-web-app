const { Client } = require("pg");
require("dotenv").config(); // Carica le variabili d'ambiente da .env in locale

// Configura il client
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl:
        process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
});

// Funzione per connettersi al DB
const connectDB = async () => {
    try {
        await client.connect();
        console.log("Connected to the database");
        const res = await client.query("SELECT NOW()");
        console.log("Date and time from database:", res.rows[0]);
    } catch (err) {
        console.error("Connection error:", err.stack);
    }
};

async function deleteGameFromDB(gameId) {
    try {
        await client.query("BEGIN");
        await client.query("DELETE FROM players_in_game WHERE game_id = $1", [
            gameId,
        ]);
        await client.query("DELETE FROM games WHERE game_id = $1", [gameId]);
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    }
}

async function resetUserStatus(players) {
    try {
        const usernames = players.map((player) => player.username);
        await client.query(
            "UPDATE users SET status = $1 WHERE username = ANY($2)",
            ["idle", usernames]
        );
    } catch (err) {
        console.error("Error while resetting user statuses:", err);
        throw err;
    }
}

module.exports = { client, connectDB, deleteGameFromDB, resetUserStatus };
