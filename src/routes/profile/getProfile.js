const express = require("express");
const router = express.Router();
const { client } = require("../../database/db");
const { playerStatsMap } = require("../../utils/playerStatistics");

router.get("/:username", async (req, res) => {
    const { username } = req.params;
    console.log("Richiesta ricevuta per l'utente:", username);
    console.log(username);

    try {
        const userCheck = await client.query(
            `SELECT user_id, avatar FROM users WHERE username = $1`,
            [username]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "Utente non trovato" });
        }

        const { user_id, avatar } = userCheck.rows[0];

        // Recupera le statistiche dell'utente dalla mappa in memoria
        const stats = playerStatsMap.get(user_id);

        if (!stats) {
            return res.status(404).json({ error: "Statistiche non trovate" });
        }

        const allStats = Array.from(playerStatsMap.values());

        allStats.sort((a, b) => b.ranked_score - a.ranked_score);
        const rank =
            allStats.findIndex((player) => player.user_id === user_id) + 1;

        const userGames = await client.query(
            `SELECT 
                gc.title,
                gc.game_type,
                gc.game_speed
            FROM game_players gp
            JOIN games_completed gc ON gp.game_uuid = gc.game_uuid
            WHERE gp.user_id = $1
            ORDER BY gc.finished_at DESC
            LIMIT 5
            `,
            [user_id]
        );

        const userGamesRow = userGames.rows[0];

        res.json({
            username,
            avatar,
            rank,
            stats,
            games: userGames.rows.length > 0 ? userGamesRow : [],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Errore server" });
    }
});

module.exports = router;
