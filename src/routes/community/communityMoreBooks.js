const express = require("express");
const router = express.Router();
const { client } = require("../../database/db");

router.get("/", async (req, res) => {
    const limit = 2;
    const offset = parseInt(req.query.offset, 10) || 0;

    try {
        const result = await client.query(
            `
            SELECT
                id,
                title,
                back_cover,
                game_type,
                game_speed,
                finished_at,
                cover_image_url,
                game_lang
            FROM
                games_completed
            WHERE
                publish = 'publish'
            ORDER BY
                started_at DESC
            LIMIT $1 OFFSET $2;
            `,
            [limit, offset]
        );

        const gamesWithSlug = result.rows.map((game) => ({
            ...game,
            slug: generateSlug(game.title),
            game_lang: game.game_lang,
        }));

        res.json({ games: gamesWithSlug });
    } catch (err) {
        console.error("Error retrieving books:", err);
        res.status(500).json({ error: "Server error" });
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
