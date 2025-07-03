const express = require("express");
const router = express.Router();
const checkAuth = require("../../middlewares/checkAuthToken");
const { client } = require("../../database/db");
const getRatingAggregate = require("../../services/getRatingAggregate");

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

        const genreQuery = await client.query(
            `SELECT g.name
            FROM game_genres gg
            JOIN genres g ON g.id = gg.genre_id
             WHERE gg.game_id = $1`,
            [game_id]
        );

        const { average, totalVotes } = await getRatingAggregate(game_id);

        const genres = genreQuery.rows.map((row) => row.name);
        console.log(genres, average, totalVotes);
        res.json({
            genres,
            chapters: chaptersWithAuthors,
            average,
            totalVotes,
        });
    } catch (err) {
        console.error("Error retrieving chapters:", err);
        res.status(500).json({
            message: "Error retrieving chapters.",
        });
    }
});

module.exports = router;
