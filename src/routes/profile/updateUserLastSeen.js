const express = require("express");
const router = express.Router();
const checkAuth = require("../../middlewares/checkAuthToken");
const { client } = require("../../database/db");

router.post("/", checkAuth, async (req, res) => {
    const user_id = req.user_id;
    if (!user_id) {
        return res.status(400).end();
    }

    try {
        await client.query(
            "UPDATE users SET last_seen_at = NOW() WHERE user_id = $1",
            [user_id]
        );
        res.status(200).json({ message: "Last seen updated" });
    } catch (error) {
        console.error("Error updating last_seen:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
