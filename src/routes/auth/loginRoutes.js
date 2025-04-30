const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const { getUserByEmail } = require("../../services/userService");
const { verifyPassword } = require("../../utils/authUtility");

router.post("/", async (req, res) => {
    const { userEmail, userPassword } = req.body;
    if (!userEmail || !userPassword) {
        return res.status(400).json({ message: "Fill up all fields" });
    }

    try {
        const user = await getUserByEmail(userEmail);
        // await verifyPassword(user.password, userPassword);

        console.log(`email da utilizzare: ${user.email}`);
        console.log(`is verified? ${user.verified}`);

        if (user.verified !== true) {
            return res.status(401).json({
                error: "unverified_email",
                message:
                    "Email non verificata. Controlla la tua casella di posta.",
            });
        }

        if (!user.username) {
            return res.status(200).json({
                redirectTo: `/completa-profilo/${user.email}`,
            });
        }

        const payload = {
            userId: user.user_id,
            username: user.username,
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

        res.status(200).json({
            success: true,
            username: user.username, // ritorniamo lo username se esiste
        });
    } catch (err) {
        console.error("Errore durante il login:", err);
        res.status(401).json({ message: err.message || "Errore del server" });
    }
});

module.exports = router;
