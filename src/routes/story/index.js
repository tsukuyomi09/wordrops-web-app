const express = require("express");
const router = express.Router();

router.use("/story-data", require("./storyData"));

module.exports = router;
