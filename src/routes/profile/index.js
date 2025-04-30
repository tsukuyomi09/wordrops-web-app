const express = require("express");
const router = express.Router();

router.use("/dashboard", require("./dashboardRoute"));
router.use("/delete-account", require("./deleteAccount"));
router.use("/avatar", require("./updateAvatar"));
router.use("/user-data", require("./userData"));

module.exports = router;
