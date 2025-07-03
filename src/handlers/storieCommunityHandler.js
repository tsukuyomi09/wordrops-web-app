const { client } = require("../database/db");

async function storieCommunityHandler(req, res) {
    const limit = 10;
    const offset = 0;
    try {
        const storiesQuery = await client.query(
            `
            SELECT
                id,
                title,
                back_cover,
                game_type,
                game_speed,
                finished_at,
                cover_image_url
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

        const storiesRaw = storiesQuery.rows;

        const stories = storiesRaw.map((story) => ({
            ...story,
            slug: generateSlug(story.title),
            game_type: story.game_type,
            game_speed: story.game_speed,
        }));
        res.render("storie-community", {
            stories: stories,
            query: {},
        });
    } catch {
        console.error("Error loading the library page:", error);
        res.status(500).send("An error occurred while loading the library.");
    }
}

function generateSlug(title) {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 50);
}

module.exports = { storieCommunityHandler };
