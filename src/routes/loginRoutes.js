const express = require('express');
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
        const token = jwt.sign(payload, secretKey, { expiresIn: '6h' });

        const isProduction = process.env.NODE_ENV === 'production';

        res.cookie("token", token, {
            httpOnly: true,  // Il cookie non può essere letto tramite JavaScript
            maxAge: 6 * 3600 * 1000,  // La durata del cookie (1 ora)
            secure: isProduction,  // Usa HTTP durante lo sviluppo
            sameSite: 'Strict',  // Impedisce l'invio in richieste cross-origin
        });
        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Errore durante il login:", err);
        res.status(401).json({ message: err.message || "Errore del server" });
    }
});

    
module.exports = router;