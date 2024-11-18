const express = require('express');
const router = express.Router();
const { client } = require('../database/db'); 
const checkSession = require('../middlewares/checkSession');


router.get("/item", checkSession, async (req, res) => {
    try {
        const user_id = req.user_id;

        // Query combinata per ottenere username e items
        const query = `SELECT u.username, i.* FROM users u LEFT JOIN items i ON u.user_id = i.user_id_ref WHERE u.user_id = $1`;
        const result = await client.query(query, [user_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Utente non trovato" });
        }

        const username = result.rows[0].username;
        res.status(200).json({
            username: username,
            items: result.rows, 
        });
    } catch (err) {
        console.error("Errore durante il recupero:", err);
        res.status(500).json({ error: "Errore del server" });
    }
});
    
    
router.post("/item", checkSession, async (req, res) => {
    try {
        const user_id = req.user_id; 
        const { item } = req.body; 

        if (!item) {
            return res.status(400).send('Item mancante nel body della richiesta');
        }

        // Query per inserire l'item
        const query = 'INSERT INTO items (item, created_at, user_id_ref) VALUES ($1, NOW(), $2) RETURNING *';
        const result = await client.query(query, [item, user_id]);

        res.status(201).json(result.rows[0]); // Risposta con il nuovo item creato
    } catch (err) {
        console.error('Errore durante l\'inserimento:', err);
        res.status(500).send('Errore del server');
    }
});


router.delete("/item/:item_id", checkSession, async (req, res) => {
    try {
        const user_id = req.user_id
        const item_id = req.params.item_id;
        console.log(`itemid: ${item_id}`)
        console.log(`user_id: ${user_id}`)

        const query = "DELETE FROM items WHERE id = $1 and user_id_ref = $2 RETURNING *";
        const result = await client.query(query, [item_id, user_id]);

        res.status(200).json(result.rows[0]);
    }

    catch (err) {
        console.error('Errore durante la cancellazione:', err);
        res.status(500).send('Errore del server');
    }
})

module.exports = router;
