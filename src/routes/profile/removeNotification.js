const express = require("express");
const router = express.Router();

const {
    removeRankedNotification,
} = require("../../utils/handleRankedNotification");
const checkAuth = require("../../middlewares/checkAuthToken");

router.delete("/", checkAuth, async (req, res) => {
    const user_id = req.user_id;
    const { game_id } = req.body;

    try {
        await removeRankedNotification(user_id, game_id);
        res.status(200).json({ message: "Notification removed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error removing notification" });
    }
});

module.exports = router;
