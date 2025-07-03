const express = require("express");
const router = express.Router();
const { client } = require("../../database/db");
const checkAuth = require("../../middlewares/checkAuthToken");

router.get("/", checkAuth, async (req, res) => {
    const query = req.query.username?.toLowerCase();

    if (!query || query.length < 3) {
        return res
            .status(400)
            .json({ error: "Query must be at least 3 characters long" });
    }

    try {
        const result = await client.query(
            "SELECT username, avatar FROM users WHERE username ILIKE $1 LIMIT 10",
            [`%${query}%`]
        );

        if (result.rows.length === 0) {
            return res.json([]);
        }

        return res.json(result.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error during search" });
    }
});

module.exports = router;
