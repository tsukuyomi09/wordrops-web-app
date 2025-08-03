const express = require("express");
const router = express.Router();

router.use("/register", require("./registerRoutes"));
router.use("/forgot-password", require("./forgotPassword"));
router.use("/reset-password", require("./resetPassword"));
router.use("/login", require("./loginRoutes"));
router.use("/google-login", require("./googleLogin"));
router.use("/verify-email", require("./verifyEmail"));
router.use("/check-session", require("./verifyLogIn"));
router.use("/logout", require("./logout"));

module.exports = router;
