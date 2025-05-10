const express = require("express");
const router = express.Router();
const checkAuth = require("../../middlewares/checkAuthToken");
const { client } = require("../../database/db");

router.delete("/", checkAuth, async (req, res) => {
    try {
        const user_id = req.user_id;

        if (!user_id) {
            return res.status(400).json({ message: "Dati mancanti." });
        }

        await client.query("DELETE FROM users WHERE user_id = $1", [user_id]);

        res.clearCookie("accesstoken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        });
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        });

        res.status(200).json({ message: "Account cancellato." });
    } catch (err) {
        console.error("Errore nella cancellazione:", err);
        res.status(401).json({ message: "Password errata o errore interno." });
    }
});

module.exports = router;
