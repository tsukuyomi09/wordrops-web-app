const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/checkAuthToken");
const checkUserStatus = require("../middlewares/checkUserStatus");

router.get("/userData", checkAuth, checkUserStatus, async (req, res) => {
    try {
        const { user_id, username, userStatus, userGames, maxGamesReached } =
            req;

        if (!username) {
            return res.status(404).json({ error: "Username non trovato" });
        }

        res.status(200).json({
            user_id,
            username,
            games: userGames,
            status: userStatus,
            maxGamesReached,
        });
    } catch (err) {
        console.error("Errore durante il recupero dello username:", err);
        res.status(500).json({ error: "Errore del server" });
    }
});

module.exports = router;
