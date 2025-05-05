const express = require("express");
const router = express.Router();
const checkAuth = require("../../middlewares/checkAuthToken");
const { playerStatsMap } = require("../../utils/playerStatistics");

router.get("/", checkAuth, async (req, res) => {
    const user_id = req.user_id;
    ("in user stats");

    try {
        const stats = playerStatsMap.get(user_id);

        if (!stats) {
            return res
                .status(404)
                .json({ error: "Statistiche non trovate per l'utente." });
        }

        return res.json(stats);
    } catch (err) {
        console.error("Errore nel recupero delle statistiche:", err);
        return res.status(500).json({ error: "Errore interno del server." });
    }
});

module.exports = router;
