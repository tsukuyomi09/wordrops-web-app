const express = require("express");
const router = express.Router();
const { client } = require("../database/db");
const jwt = require("jsonwebtoken");

router.post("/finish-onboarding/:email", async (req, res) => {
    const { username, avatarName } = req.body;
    const { email } = req.params;

    if (!username || !avatarName) {
        return res.status(400).json({
            message: "Username e avatar sono obbligatori.",
        });
    }

    try {
        // Inserimento nel database
        const result = await client.query(
            `UPDATE users
             SET username = $1, avatar = $2
             WHERE email = $3
             RETURNING user_id, username, avatar`,
            [username, avatarName, email]
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
            message: "Onboarding completato con successo!",
            success: true,
            username: updatedUsername, // ritorniamo lo username se esiste
        });
    } catch (error) {
        // Gestione degli errori
        console.error("Errore nel database:", error);
        res.status(500).json({
            message:
                "Si è verificato un errore durante il completamento dell'onboarding.",
            error: error.message,
        });
    }
});

module.exports = router;
