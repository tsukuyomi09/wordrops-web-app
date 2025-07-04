const express = require("express");
const router = express.Router();
const { client } = require("../../database/db");
const jwt = require("jsonwebtoken");

router.post("/:email", async (req, res) => {
    const { username, avatarName } = req.body;
    const { email } = req.params;

    if (!username || !avatarName) {
        return res.status(400).json({
            message: "Username and avatar are required.",
        });
    }

    try {
        const result = await client.query(
            `UPDATE users
             SET username = $1, avatar = $2, is_onboarding_complete = $3
             WHERE email = $4
             RETURNING user_id, username, avatar`,
            [username, avatarName, true, email]
        );

        const { user_id, username: updatedUsername } = result.rows[0];

        const payload = {
            userId: user_id,
            username: updatedUsername,
        };

        const secretKey = process.env.ACCESS_TOKEN_SECRET;
        const newAccessToken = jwt.sign(payload, secretKey, {
            expiresIn: "15m",
        });
        const refreshToken = jwt.sign(
            payload,
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "15d" }
        );

        const isProduction = process.env.NODE_ENV === "production";

        res.cookie("accesstoken", newAccessToken, {
            httpOnly: true,
            maxAge: 15 * 60 * 1000,
            secure: isProduction,
            sameSite: "Strict",
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 15 * 24 * 3600 * 1000,
            secure: isProduction,
            sameSite: "Strict",
        });

        res.status(201).json({
            message: "Onboarding completed successfully!",
            success: true,
            username: updatedUsername,
        });
    } catch (error) {
        console.error("Error in the database:", error);
        res.status(500).json({
            message: "An error occurred during onboarding completion.",
            error: error.message,
        });
    }
});

module.exports = router;
