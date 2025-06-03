const express = require("express");
const router = express.Router();
const checkAuth = require("../../middlewares/checkAuthToken");
const { client } = require("../../database/db");

router.post("/", checkAuth, async (req, res) => {
    const user_id = req.user_id;
    console.log(`user_id = ${user_id}`);
    if (!user_id) {
        return res
            .status(400)
            .json({ error: "User ID not found in the request" });
    }

    try {
        await client.query(
            "UPDATE users SET last_seen_at = NOW() WHERE user_id = $1",
            [user_id]
        );
        console.log("updated");
        res.status(200).json({ message: "Last seen updated" });
    } catch (error) {
        console.error("Errore aggiornamento last_seen:", error);
        res.status(500).json({ error: "Errore server" });
    }
});

module.exports = router;
