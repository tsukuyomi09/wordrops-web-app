const express = require('express');
const router = express.Router();
const { client } = require('../database/db'); 
const checkAuth = require('../middlewares/checkAuthToken');


router.get('/gamequeue/:game_id/players', checkAuth, async (req, res) => {
    const { game_id } = req.params;  // Ottieni il game_id dal parametro della rotta

    const query = `
        SELECT u.username
        FROM users u
        JOIN players_in_game p ON u.user_id = p.user_id
        WHERE p.game_id = $1
        ORDER BY p.turn_order;`;

    try {
        const result = await client.query(query, [game_id]);  // Esegui la query
        res.status(200).json(result.rows);  // Restituisci i dati come JSON
    } catch (err) {
        console.error('Errore nella query:', err);
        res.status(500).json({ error: 'Errore nella query' });  // Gestione errore
    }
})

module.exports = router;
