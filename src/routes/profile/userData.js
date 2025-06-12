const express = require("express");
const router = express.Router();
const checkAuth = require("../../middlewares/checkAuthToken");
const checkUserStatus = require("../../middlewares/checkUserStatus");
const { notificationMap } = require("../../services/notificationMap");

router.get("/", checkAuth, checkUserStatus, async (req, res) => {
    try {
        const { user_id, username, userStatus, userGames, maxGamesReached } =
            req;

        if (!username) {
            return res.status(400).json({ error: "Username non trovato" });
        }

        const gameNotifications = notificationMap.get(user_id);

        res.status(200).json({
            user_id,
            username,
            games: userGames,
            status: userStatus,
            maxGamesReached,
            gameNotifications,
        });
    } catch (err) {
        console.error("Errore durante il recupero dello username:", err);
        res.status(500).json({ error: "Errore del server" });
    }
});

module.exports = router;
