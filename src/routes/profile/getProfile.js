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
                gc.id,
                gc.title,
                gc.game_type,
                gc.game_speed,
                gc.finished_at,
                gc.back_cover,
                gc.cover_image_url
            FROM game_players gp
            JOIN games_completed gc ON gp.game_uuid = gc.game_uuid
            WHERE gp.user_id = $1
            ORDER BY gc.finished_at DESC
            LIMIT 5
            `,
            [user_id]
        );

        res.json({
            username,
            avatar,
            rank,
            stats,
            games: Array.isArray(userGames.rows)
                ? userGames.rows.map((game) => ({
                      ...game,
                      slug: generateSlug(game.title),
                  }))
                : [],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Errore server" });
    }
});

function generateSlug(title) {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 50);
}

module.exports = router;
