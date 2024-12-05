const express = require('express');
const router = express.Router();
const { client } = require('../database/db'); 

router.get('/game/:gameId/players', async (req, res) => {
    const gameId = req.params.gameId;
    try {
        const result = await client.query(`
        SELECT u.username, u.avatar, p.user_id
        FROM players_in_game p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.game_id = $1
    `, [gameId]);

        // Invia le informazioni dei giocatori al client
        res.json(result.rows);
    } catch (error) {
        console.error('Errore nel recuperare i giocatori:', error);
        res.status(500).send('Errore interno del server');
    }
});

module.exports = router;
