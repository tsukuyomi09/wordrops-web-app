const express = require("express");
const router = express.Router();
const checkAuth = require("../../middlewares/checkAuthToken");
const { client } = require("../../database/db");

router.get("/:game_id", checkAuth, async (req, res) => {
    const { game_id } = req.params;

    try {
        const { rows } = await client.query(
            `SELECT gc.id, gc.title, gc.content, gc.turn_position, gc.author_id
            FROM games_chapters gc
            WHERE gc.game_id = $1
            ORDER BY gc.turn_position ASC`,
            [game_id]
        );

        const chaptersWithAuthors = [];

        for (let chapter of rows) {
            const authorQuery = await client.query(
                `SELECT username, avatar FROM users WHERE user_id = $1`,
                [chapter.author_id]
            );

            if (authorQuery.rows.length > 0) {
                const author = authorQuery.rows[0];
                chapter.username = author.username;
                chapter.avatar = author.avatar;
            }
            chaptersWithAuthors.push(chapter);
        }
        res.json({ chapters: chaptersWithAuthors });
    } catch (err) {
        console.error("Errore nel recupero dei capitoli:", err);
        res.status(500).json({
            message: "Errore nel recupero dei capitoli.",
        });
    }
});

module.exports = router;
