const express = require('express');
const router = express.Router();

const { getUserByUsername } = require("../services/userService");
const { verifyPassword } = require("../utils/authUtility");
const { createLoginSession } = require("../services/sessionServices");


router.post("/login", async (req, res) => {
    const { loginUserName, loginPassword } = req.body;

    if (!loginUserName || !loginPassword) {
        return res.status(400).json({ message: "Fill up all fields" });
    }

    try {
        const user = await getUserByUsername(loginUserName);
        await verifyPassword(user.password, loginPassword);
        const sessionId = await createLoginSession(user.user_id);
        res.cookie("sessionId", sessionId, { httpOnly: true, maxAge: 3600 * 1000 });
        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Errore durante il login:", err);
        res.status(401).json({ message: err.message || "Errore del server" });
    }
});

    

module.exports = router;