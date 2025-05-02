const express = require("express");
const router = express.Router();

router.use("/game-page", require("./gamePage"));
router.use("/game-data", require("./gameData"));
router.use("/game-queue", require("./gameQueue"));
router.use("/player-ready", require("./playerReady"));
router.use("/game-status", require("./gameStatus"));
router.use("/save-chapter-change-turn", require("./saveChapterChangeTurn"));

module.exports = router;
