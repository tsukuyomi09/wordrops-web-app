const { client } = require("./database");

const createItem = (req, res) => {
    let body = "";
    req.on("data", chunk => {
        body += chunk.toString();
    });
    req.on("end", () => {
        const item = JSON.parse(body).item;
        const user_id = req.headers['authorization']?.split(' ')[1];

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

const getItems = (req, res) => {
    const user_id = req.headers['authorization']?.split(' ')[1];
    if (!user_id) {
        res.writeHead(400); // 400 Bad Request
        res.end("ID utente mancante nel header Authorization");
        return;
    }

    const query = "SELECT * FROM items WHERE user_id_ref = $1";
    client.query(query, [user_id])
        .then(result => {
            if (result.rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" }); // 404 Not Found
                res.end(JSON.stringify({ message: "Nessun oggetto trovato per questo utente" }));
            } else {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(result.rows)); // Restituisce gli oggetti trovati
            }
        })
        .catch(err => {
            console.error("Errore durante il recupero:", err);
            res.writeHead(500);
            res.end("Errore del server");
        });
};

const deleteItem = (req, res) => {
    const itemId = req.url.split("/")[2];
    const user_id = req.headers['authorization']?.split(' ')[1];

    if (!user_id) {
        res.writeHead(400); // 400 Bad Request
        res.end("ID utente mancante nel header Authorization");
        return;
    }
    
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