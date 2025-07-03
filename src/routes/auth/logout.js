const express = require("express");
const router = express.Router();
const checkAuth = require("../../middlewares/checkAuthToken");

router.delete("/", checkAuth, (req, res) => {
    try {
        res.clearCookie("accesstoken");
        res.clearCookie("refreshToken");

        res.status(200).json({ message: "Logout successful" });
    } catch (err) {
        console.error("Error during logout:", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
