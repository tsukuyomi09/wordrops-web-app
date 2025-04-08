const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/checkAuthToken");

router.delete("/logout", checkAuth, (req, res) => {
    try {
        res.clearCookie("token");
        res.clearCookie("refreshToken");

        res.status(200).json({ message: "Logout effettuato con successo" });
    } catch (err) {
        console.error("Errore durante il logout:", err);
        res.status(500).json({ error: "Errore del server" });
    }
});

module.exports = router;
