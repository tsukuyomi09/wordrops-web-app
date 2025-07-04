const path = require("path");
const getRatingAggregate = require("../services/getRatingAggregate");

const { client } = require("../database/db");

async function storiaHandler(req, res) {
    userVote = null;
    const user_id = req.user_id;
    const isLoggedIn = req.isLoggedIn;
    const id_slug = req.params.id_slug;
    const idPart = parseInt(id_slug.split("-")[0]);
    const id = Number(idPart);

    try {
        const gameResult = await client.query(
            "SELECT id, title, game_type, game_speed, back_cover, finished_at, lang FROM games_completed WHERE id = $1",
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

        const genreQuery = await client.query(
            `SELECT g.name
            FROM game_genres gg
            JOIN genres g ON g.id = gg.genre_id
             WHERE gg.game_id = $1`,
            [id]
        );

        const { average, totalVotes } = await getRatingAggregate(id);

        if (isLoggedIn) {
            const voteResult = await client.query(
                `SELECT rating FROM story_ratings WHERE game_id = $1 AND user_id = $2`,
                [id, user_id]
            );
            if (voteResult.rows.length > 0) {
                userVote = voteResult.rows[0].rating;
            }
        }

        const chapters = chaptersResult.rows;
        const genres = genreQuery.rows.map((row) => row.name);

        const authors = chapters.map((chapter) => ({
            username: chapter.username,
            avatar: chapter.avatar,
        }));

        if (gameResult.rows.length > 0) {
            const {
                id,
                title,
                finished_at,
                game_type,
                game_speed,
                back_cover,
                lang: langFromDb,
            } = gameResult.rows[0];
            const slugTitle = generateSlug(title);

            // Qui usi res.render e passi i dati a EJS
            res.render("story", {
                isLoggedIn,
                user_id,
                userVote,
                average,
                totalVotes,
                game_type: game_type,
                game_speed: game_speed,
                book_title: title,
                slug: slugTitle,
                id: id,
                authors: authors,
                finished_at: finished_at,
                chapters: chapters,
                genres: genres,
                back_cover: back_cover,
                lang: langFromDb,
                story_url: `https://wordrops.com/story/${langFromDb}/${id}-${slugTitle}`,
            });
        } else {
            res.status(404).sendFile(
                path.join(__dirname, "../../views", "404.html")
            );
        }
    } catch (error) {
        console.error("Error during query:", error);
        res.status(500).sendFile(
            path.join(__dirname, "../../views", "404.html")
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

module.exports = { storiaHandler };
