const express = require("express");
const router = express.Router();
const { client } = require("../../database/db");
const path = require("path");

router.get("/", async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: "Missing Token." });
    }

    try {
        const userResult = await client.query(
            "SELECT * FROM users WHERE verification_token = $1",
            [token]
        );

        if (userResult.rowCount === 0) {
            return res.sendFile(
                path.join(__dirname, "../../../views/verify-email-error.html")
            );
        }

        await client.query(
            "UPDATE users SET verified = true, verification_token = NULL WHERE verification_token = $1",
            [token]
        );

        return res.sendFile(
            path.join(__dirname, "../../../views/verify-email-success.html")
        );
    } catch (err) {
        console.error("Error during verification:", err);
        res.status(500).send("Server error");
    }
});

module.exports = router;
