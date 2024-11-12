const { client } = require("./database");


const getDashboardData = (req, res) => {
    const user_id = req.user_id;

    // Prima query per ottenere l'username dalla tabella users
    const userQuery = "SELECT username FROM users WHERE user_id = $1";
    client.query(userQuery, [user_id])
        .then(userResult => {
            if (userResult.rows.length === 0) {
                res.writeHead(404);
                return res.end("Utente non trovato");
            }
            const username = userResult.rows[0].username;

            // Seconda query per ottenere gli items relativi all'user_id
            const itemsQuery = "SELECT * FROM items WHERE user_id_ref = $1";
            return client.query(itemsQuery, [user_id])
                .then(itemResult => {
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        username: username, // Aggiungi l'username alla risposta
                        items: itemResult.rows // Aggiungi gli oggetti trovati alla risposta
                    }));
                });
        })
        .catch(err => {
            console.error("Errore durante il recupero:", err);
            res.writeHead(500);
            res.end("Errore del server");
        });
};

module.exports = { getDashboardData };