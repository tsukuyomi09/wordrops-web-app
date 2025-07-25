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
        if (process.env.NODE_ENV === "production") {
            await verifyPassword(user.password, userPassword);
        }
        if (user.verified !== true) {
            return res.status(401).json({
                error: "unverified_email",
                message: "Email not verified. Check your inbox.",
            });
        }

        if (!user.username) {
            return res.status(200).json({
                redirectTo: `/complete-profile/${user.email}`,
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
            username: user.username,
        });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(401).json({ message: err.message || "Server error" });
    }
});

module.exports = router;
