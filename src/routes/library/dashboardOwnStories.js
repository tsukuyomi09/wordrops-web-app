const express = require("express");
const router = express.Router();
const { client } = require("../../database/db");
const checkAuth = require("../../middlewares/checkAuthToken");

router.get("/", checkAuth, async (req, res) => {
    const user_id = req.user_id;

    try {
        const { rows } = await client.query(
            `SELECT DISTINCT g.id, g.title, g.finished_at, g.back_cover, g.cover_image_url, g.game_type, g.game_speed
             FROM games_chapters gc
             JOIN games_completed g ON gc.game_id = g.id
             WHERE gc.author_id = $1
             ORDER BY g.finished_at DESC
             LIMIT 10`,
            [user_id]
        );

        // Restituisce solo i titoli delle storie
        res.json({ completedGames: rows });
    } catch (err) {
        console.error("Errore nel recupero dei giochi completati:", err);
        res.status(500).json({
            message: "Errore nel recupero dei giochi completati.",
        });
    }
});

module.exports = router;
