const { client } = require("../database/db");

async function storieCommunityHandler(req, res) {
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
                started_at DESC;
        `
        );

        const storiesRaw = storiesQuery.rows;

        const stories = storiesRaw.map((story) => ({
            ...story,
            slug: generateSlug(story.title),
        }));
        res.render("storie-community", {
            stories: stories,
            query: {},
        });
    } catch {
        console.error(
            "Errore nel caricamento della pagina della libreria:",
            error
        );
        res.status(500).send(
            "Si è verificato un errore nel caricamento della libreria."
        );
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
