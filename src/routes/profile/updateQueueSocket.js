const express = require("express");
const router = express.Router();
const {
    gameQueues,
    playerQueuePosition,
} = require("../../services/gameQueueData");
const checkAuth = require("../../middlewares/checkAuthToken");

router.post("/", checkAuth, (req, res) => {
    const user_id = req.user_id;
    const { socketId } = req.body;

    const pos = playerQueuePosition[user_id];

    const queue = gameQueues[pos.gameType]?.[pos.gameSpeed];

    // Cerca direttamente il player
    const player = queue.toArray().find((p) => p.user_id === user_id);

    player.socketId = socketId;
    console.log("----- COMPLETE QUEUE STATUS -----");
    for (const gameType in gameQueues) {
        for (const gameSpeed in gameQueues[gameType]) {
            const queue = gameQueues[gameType][gameSpeed];
            const players = queue.toArray().map((p, index) => ({
                pos: index + 1,
                user_id: p.user_id,
                username: p.username,
                socketId: p.socketId,
                timestamp: new Date(p.timestamp).toLocaleTimeString(),
            }));
            console.log(
                `Queue ${gameType}/${gameSpeed} (${players.length} player):`
            );
            console.table(players);
        }
    }
    return res.json({ success: true, message: "SocketId updates" });
});

module.exports = router;
