const express = require("express");
const router = express.Router();
const path = require("path");
const checkAuth = require("../../middlewares/checkAuthToken");
const { client } = require("../../database/db");
const checkUserGameStatus = require("../../services/checkUserGameStatus");

router.get("/:username", checkAuth, checkUserGameStatus, async (req, res) => {
    const { username } = req.params;

    try {
        if (username !== req.username) {
            return res
                .status(403)
                .send("You cannot view another user's dashboard.");
        }
        const result = await client.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );
        if (result.rows.length === 0) {
            return res.status(404).send("User not found");
        }
        res.sendFile(
            path.join(__dirname, "..", "..", "views", "dashboard.html")
        );
    } catch (err) {
        console.error("Error retrieving user data:", err);
        res.status(500).json({
            message: "Internal server error. Please try again later.",
        });
    }
});

module.exports = router;
