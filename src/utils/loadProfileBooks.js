const { client } = require("../database/db");

async function loadProfileBooks(user_id, limit, offset) {
    const result = await client.query(
        `SELECT gc.id, gc.title, gc.game_type, gc.game_speed, gc.finished_at, gc.back_cover, gc.cover_image_url, gc.lang
        FROM game_players gp
        JOIN games_completed gc ON gp.game_uuid = gc.game_uuid
        WHERE gp.user_id = $1
        ORDER BY gc.finished_at DESC
        LIMIT $2 OFFSET $3`,
        [user_id, limit, offset]
    );

    return result.rows.map((game) => ({
        ...game,
        slug: generateSlug(game.title),
        lang: game.lang,
    }));
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

module.exports = { loadProfileBooks };
