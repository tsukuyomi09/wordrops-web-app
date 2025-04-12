const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/checkAuthToken");
const { client } = require("../database/db");

router.post("/avatar", checkAuth, async (req, res) => {
    const user_id = req.user_id;
    const username = req.username;
    const { avatar } = req.body;

    if (!avatar) {
        return res.status(400).json({ error: "Avatar non selezionato!" });
    }

    try {
        const result = await client.query(
            "UPDATE users SET avatar = $1 WHERE user_id = $2 RETURNING avatar;",
            [avatar, user_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Utente non trovato" });
        }

        res.json({
            message: "Avatar aggiornato con successo",
            avatar: result.rows[0].avatar,
            username: username,
        });
    } catch (error) {
        console.error("Errore nell'aggiornamento dell'avatar:", error);
        res.status(500).json({ error: "Errore nel salvataggio dell'avatar" });
    }
});

router.get("/avatar", checkAuth, async (req, res) => {
    const user_id = req.user_id; // Estratto dal JWT

    try {
        const result = await client.query(
            "SELECT avatar FROM users WHERE user_id = $1",
            [user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Avatar non trovato" });
        }

        res.status(200).json({ avatar: result.rows[0].avatar });
    } catch (err) {
        console.error("Errore nel recupero dell'avatar:", err);
        res.status(500).json({ message: "Errore del server" });
    }
});

module.exports = router;
