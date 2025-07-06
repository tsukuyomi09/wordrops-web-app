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

    const queue = gameQueues[pos.gameType]?.[pos.gameSpeed]?.[pos.game_lang];

    // Cerca direttamente il player
    const player = queue.toArray().find((p) => p.user_id === user_id);

    player.socketId = socketId;
    console.log("----- COMPLETE QUEUE STATUS -----");
    for (const gameType in gameQueues) {
        for (const gameSpeed in gameQueues[gameType]) {
            for (const game_lang in gameQueues[gameType][gameSpeed]) {
                const queue = gameQueues[gameType][gameSpeed][game_lang];
                const players = queue.toArray().map((p, index) => ({
                    pos: index + 1,
                    user_id: p.user_id,
                    username: p.username,
                    socketId: p.socketId,
                    timestamp: new Date(p.timestamp).toLocaleTimeString(),
                }));
                if (players.length > 0) {
                    console.log(
                        `Queue ${gameType}/${gameSpeed}/${game_lang} (${players.length} players):`
                    );
                    console.table(players);
                }
            }
        }
    }
    return res.json({ success: true, message: "SocketId updates" });
});

module.exports = router;
