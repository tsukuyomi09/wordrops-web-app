const express = require("express");
const router = express.Router();

router.use("/", require("./leaderboardScores"));

module.exports = router;
