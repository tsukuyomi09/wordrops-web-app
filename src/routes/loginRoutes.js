const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const { getUserByUsername } = require("../services/userService");
const { verifyPassword } = require("../utils/authUtility");

router.post("/login", async (req, res) => {
    const { loginUserName, loginPassword } = req.body;
    if (!loginUserName || !loginPassword) {
        return res.status(400).json({ message: "Fill up all fields" });
    }

    try {
        const user = await getUserByUsername(loginUserName);
        await verifyPassword(user.password, loginPassword);

        const payload = {
            userId: user.user_id,
            username: user.username,
        };

        const secretKey = process.env.ACCESS_TOKEN_SECRET;
        const accessToken = jwt.sign(payload, secretKey, { expiresIn: "15m" });
        const refreshToken = jwt.sign(
            payload,
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "15d" }
        );

        const isProduction = process.env.NODE_ENV === "production";

        res.cookie("token", accessToken, {
            httpOnly: true, // Il cookie non può essere letto tramite
            maxAge: 30 * 1000, // La durata del cookie (30 secondi)
            // maxAge: 15 * 60 * 100, // La durata del cookie (15 minuti)
            secure: isProduction, // Usa HTTPS durante la produzione
            sameSite: "Strict", // Impedisce l'invio in richieste cross-origin
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true, // Il cookie non può essere letto tramite JavaScript
            maxAge: 15 * 24 * 3600 * 1000, // Durata del cookie (15 giorni)
            secure: isProduction, // Usa HTTPS durante la produzione
            sameSite: "Strict", // Impedisce l'invio in richieste cross-origin
        });

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Errore durante il login:", err);
        res.status(401).json({ message: err.message || "Errore del server" });
    }
});

module.exports = router;
