const express = require("express");
const router = express.Router();
const checkAuth = require("../../middlewares/checkAuthToken");
const { playerStatsMap } = require("../../utils/playerStatistics");
const getPlayerStatsFromDB = require("../../utils/getPlayerStatsFromDB");

router.get("/", checkAuth, async (req, res) => {
    const user_id = req.user_id;
    ("in user stats");

    try {
        let playerStats = playerStatsMap.get(user_id);

        if (!playerStats) {
            playerStats = await getPlayerStatsFromDB(user_id);

            if (!playerStats) {
                playerStats = {
                    classic_played: 0,
                    ranked_played: 0,
                    stories_abandoned: 0,
                    ranked_score: 200,
                    perfect_performances: 0,
                    worst_performances: 0,
                };
            }
            playerStatsMap.set(user_id, playerStats);
        }

        return res.json(playerStats);
    } catch (err) {
        console.error("Errore nel recupero delle statistiche:", err);
        return res.status(500).json({ error: "Errore interno del server." });
    }
});

module.exports = router;
