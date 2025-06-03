const express = require("express");
const router = express.Router();

router.use("/dashboard", require("./dashboardRoute"));
router.use("/user-profile-data", require("./getProfile"));
router.use("/delete-account", require("./deleteAccount"));
router.use("/avatar", require("./updateAvatar"));
router.use("/user-data", require("./userData"));
router.use("/load-more-books", require("./loadMoreBooks"));
router.use("/user-stats", require("./userStats"));
router.use("/remove-game-notification", require("./removeNotification"));
router.use("/user-last-seen", require("./updateUserLastSeen"));

module.exports = router;
