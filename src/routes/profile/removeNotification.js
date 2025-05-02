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
        res.status(200).send("Notification removed successfully");
    } catch (error) {
        res.status(500).send("Error removing notification");
    }
});

module.exports = router;
