const path = require("path");
const { client } = require("../database/db");

async function storiaHandler(req, res) {
    const id_slug = req.params.id_slug;
    console.log(id_slug);
    const id = parseInt(id_slug.split("-")[0]);
    try {
        const gameResult = await client.query(
            "SELECT id, title FROM games_completed WHERE id = $1",
            [id]
        );

        const chaptersResult = await client.query(
            `SELECT 
                cc.title, 
                cc.content, 
                cc.turn_position, 
                u.user_id,
                u.username, 
                u.avatar
                FROM 
                    games_chapters cc
                JOIN 
                    users u ON cc.author_id = u.user_id
                WHERE 
                    cc.game_id = $1
                ORDER BY 
                    cc.turn_position ASC;`,
            [id]
        );

        const chapters = chaptersResult.rows;

        const authors = chapters.map((chapter) => ({
            username: chapter.username,
            avatar: chapter.avatar,
        }));

        console.log(`autori: ${authors}`);

        console.log(chapters.rows);

        if (gameResult.rows.length > 0) {
            const { id, title } = gameResult.rows[0];
            const slugTitle = generateSlug(title);
            console.log(slugTitle);

            // Qui usi res.render e passi i dati a EJS
            res.render("storia", {
                book_title: title,
                slug: slugTitle,
                id: id,
                authors: authors,
            });
        } else {
            res.status(404).sendFile(
                path.join(__dirname, "../../views", "404.html")
            );
        }
    } catch (error) {
        console.error("Errore durante la query:", error);
        res.status(500).send("C'è stato un errore interno del server");
    }
}

function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

module.exports = { storiaHandler };
