const express = require("express");
const router = express.Router();
const checkAuth = require("../../middlewares/checkAuthToken");
const { client } = require("../../database/db");
const { verifyPassword } = require("../../utils/authUtility");

router.post("/profile/delete-account", checkAuth, async (req, res) => {
    try {
        const user_id = req.user_id;
        const { password } = req.body;

        if (!user_id || !password) {
            return res.status(400).json({ message: "Dati mancanti." });
        }

        const result = await client.query(
            "SELECT password FROM users WHERE user_id = $1",
            [user_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Utente non trovato." });
        }

        const storedHash = result.rows[0].password;

        if (process.env.NODE_ENV === "production") {
            await verifyPassword(storedHash, password);
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
