const express = require("express");
const router = express.Router();
const { client } = require("../../database/db");
const checkAuth = require("../../middlewares/checkAuthToken");
const getRatingAggregate = require("../../services/getRatingAggregate");

router.post("/", checkAuth, async (req, res) => {
    const { story_id, story_vote } = req.body;
    const user_id = req.user_id;
    console.log(`Voto ricevuto per storia ${story_id}: ${story_vote}`);

    if (!story_id || !story_vote) {
        return res
            .status(400)
            .json({ error: true, message: "Parametri mancanti o non validi" });
    }

    if (typeof story_vote !== "number" || story_vote < 1 || story_vote > 5) {
        return res
            .status(400)
            .json({ error: true, message: "Valore voto non valido" });
    }

    try {
        const data = await saveVoteAndCalculateAverage(
            user_id,
            story_id,
            story_vote
        );
        return res.status(200).json(data);
    } catch (error) {
        console.error("Errore nel recupero dati storia:", error);
        res.status(500).json({ error: "Errore interno del server" });
    }
});

async function saveVoteAndCalculateAverage(user_id, story_id, story_vote) {
    try {
        //controllo generale per capire che strada intraprendere
        const existingVote = await client.query(
            `SELECT rating FROM story_ratings WHERE game_id=$1 AND user_id=$2`,
            [story_id, user_id]
        );

        if (existingVote.rowCount > 0) {
            // logica se l'utente ha giá votato

            const oldVote = existingVote.rows[0].rating;
            if (oldVote === story_vote) {
                return {
                    status: "unchanged",
                    message: "Hai dato lo stesso voto",
                };
            }
            await client.query(
                `UPDATE story_ratings SET rating=$1, updated_at=NOW() WHERE game_id=$2 AND user_id=$3`,
                [story_vote, story_id, user_id]
            );
            await client.query(
                `UPDATE story_rating_aggregates SET
                total_rating = total_rating - $1 + $2
                WHERE game_id = $3`,
                [oldVote, story_vote, story_id]
            );
        } else {
            // logica per il primo voto
            await client.query(
                `INSERT INTO story_ratings (game_id, user_id, rating, created_at, updated_at)
                        VALUES ($1, $2, $3, NOW(), NOW())`,
                [story_id, user_id, story_vote]
            );
            await client.query(
                `INSERT INTO story_rating_aggregates (game_id, total_rating, total_votes)
                VALUES ($1, $2, $3)
                ON CONFLICT (game_id) DO UPDATE SET
                total_rating = story_rating_aggregates.total_rating + EXCLUDED.total_rating,
                total_votes = story_rating_aggregates.total_votes + EXCLUDED.total_votes`,
                [story_id, story_vote, 1]
            );
        }

        const { average, totalVotes } = await getRatingAggregate(story_id);

        return {
            status: "updated",
            data: {
                average,
                totalVotes,
                story_vote,
            },
            message: "Voto registrato con successo",
        };
    } catch (error) {
        console.error("Errore in saveVoteAndCalculateAverage:", error);
        throw error; // lascia gestire l'errore al chiamante
    }
}

module.exports = router;
