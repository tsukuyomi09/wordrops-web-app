const express = require("express");
const router = express.Router();
const { playerQueuePosition } = require("../../services/gameQueueData");
const checkAuth = require("../../middlewares/checkAuthToken");

router.get("/", checkAuth, (req, res) => {
    console.log("✅ Rotta /game caricata correttamente");

    const user_id = req.user_id;
    const queueInfo = playerQueuePosition[user_id];

    if (!queueInfo) {
        return res.status(200).json({ inQueue: false });
    }

    res.status(200).json({ inQueue: true, ...queueInfo });
});

module.exports = router;
