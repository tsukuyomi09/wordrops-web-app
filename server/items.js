const { client } = require("./database");

const createItem = (req, res,) => {
    let body = "";
    req.on("data", chunk => {
        body += chunk.toString();
    });
    req.on("end", () => {
        const user_id = req.user_id

        const item = JSON.parse(body).item;

        if (!user_id) {
            res.writeHead(400); // 400 Bad Request
            res.end("ID utente mancante nel header Authorization");
            return;
        }
        const query = "INSERT INTO items (item, created_at, user_id_ref) VALUES ($1, NOW(), $2) RETURNING *";
        client.query(query, [item, user_id])
            .then(result => {
                res.writeHead(201);
                res.end(JSON.stringify(result.rows[0]));
            })
            .catch(err => {
                console.error("Errore durante l'inserimento:", err);
                res.writeHead(500);
                res.end("Errore del server");
            });
    });
};

const getItems = (req, res,) => {
    const user_id = req.user_id
    const itemsQuery = "SELECT * FROM items WHERE user_id_ref = $1";
    client.query(itemsQuery, [user_id])
        .then(itemResult => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(itemResult.rows)); // Restituisce gli oggetti trovati
        })
        .catch(err => {
            console.error("Errore durante il recupero:", err);
            res.writeHead(500);
            res.end("Errore del server");
        });
};

const deleteItem = (req, res) => {
    const user_id = req.user_id
    const itemId = req.url.split('/').pop();
    const query = "DELETE FROM items WHERE id = $1 and user_id_ref = $2 RETURNING *";
    client.query(query, [itemId, user_id])
        .then(result => {
            res.writeHead(200);
            res.end(JSON.stringify(result.rows[0]));
        })
        .catch(err => {
            console.error("Errore durante la cancellazione:", err);
            res.writeHead(500);
            res.end("Errore del server");
        });
};

module.exports = { createItem, getItems, deleteItem };