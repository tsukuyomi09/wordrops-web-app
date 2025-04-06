const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/checkAuthToken");
const { client } = require("../database/db");

router.get("/storyDetails/:game_id", checkAuth, async (req, res) => {
    const { game_id } = req.params; // Prendiamo il game_id dalla richiesta
    console.log(`game id: ${game_id}`);

    try {
        // Query per ottenere tutti i capitoli di una storia, ordinati per turn_position
        const { rows } = await client.query(
            `SELECT gc.id, gc.title, gc.content, gc.turn_position, gc.author_id
            FROM games_chapters gc
            WHERE gc.game_id = $1
            ORDER BY gc.turn_position ASC`,
            [game_id]
        );

        // Array per contenere i capitoli con l'username e avatar
        const chaptersWithAuthors = [];

        // Itera sui capitoli e recupera i dati dell'autore
        for (let chapter of rows) {
            const authorQuery = await client.query(
                `SELECT username, avatar FROM users WHERE user_id = $1`,
                [chapter.author_id]
            );

            // Aggiungi i dati dell'autore al capitolo
            if (authorQuery.rows.length > 0) {
                const author = authorQuery.rows[0];
                chapter.username = author.username;
                chapter.avatar = author.avatar;
            }

            // Aggiungi il capitolo con i dettagli dell'autore all'array
            chaptersWithAuthors.push(chapter);
        }

        console.log(JSON.stringify(chaptersWithAuthors, null, 2));

        // Restituiamo i capitoli con i dati dell'autore
        res.json({ chapters: chaptersWithAuthors });
    } catch (err) {
        console.error("Errore nel recupero dei capitoli:", err);
        res.status(500).json({ message: "Errore nel recupero dei capitoli." });
    }
});

module.exports = router;
