const { client } = require("../database/db");

const getRatingAggregate = async (story_id) => {
    const res = await client.query(
        `SELECT total_rating, total_votes FROM story_rating_aggregates WHERE game_id = $1`,
        [story_id]
    );

    if (res.rows.length === 0 || res.rows[0].total_votes === 0) {
        return { average: null, totalVotes: 0 };
    }

    const { total_rating, total_votes } = res.rows[0];

    return {
        average: total_rating / total_votes,
        totalVotes: total_votes,
    };
};

module.exports = getRatingAggregate;
