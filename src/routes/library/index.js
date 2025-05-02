const express = require("express");
const router = express.Router();

router.use("/dashboard-own-stories", require("./dashboardOwnStories"));
router.use("/dashboard-story-details", require("./ownStoryDetails"));

module.exports = router;
