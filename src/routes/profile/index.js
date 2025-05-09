const express = require("express");
const router = express.Router();

router.use("/profile", require("./profilePage"));
router.use("/dashboard", require("./dashboardRoute"));
router.use("/delete-account", require("./deleteAccount"));
router.use("/avatar", require("./updateAvatar"));
router.use("/user-data", require("./userData"));
router.use("/user-stats", require("./userStats"));
router.use("/remove-game-notification", require("./removeNotification"));

module.exports = router;
