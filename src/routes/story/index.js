const express = require("express");
const router = express.Router();

router.use("/story-data", require("./storyData"));
router.use("/story-rate", require("./storyRate"));

module.exports = router;
