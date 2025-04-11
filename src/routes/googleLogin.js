const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { client } = require("../database/db");

// Inizializza il client Google con il tuo client ID
const clientGoogle = new OAuth2Client(
    "706006966723-3qafmigciao7oo5vguvhks4353i6cvhq.apps.googleusercontent.com"
);

// Route per gestire la verifica del token
router.post("/google-login", async (req, res) => {
    const { idToken } = req.body; // Ottieni il token dal corpo della richiesta

    try {
        // Verifica il token e ottieni i dati dell'utente
        const payload = await verifyGoogleToken(idToken);
        const { sub, name, given_name, family_name, email, picture, locale } =
            payload;

        // Controlla se l'utente esiste già nel database
        let user = await findUserByGoogleId(sub);

        if (user) {
            // Se l'utente esiste, generiamo i token
            const { accessToken, refreshToken } = generateTokens(
                user.user_id,
                user.username
            );

            // Imposta i cookie per i token
            setAuthCookies(res, accessToken, refreshToken);

            return res.json({
                success: true,
                user: {
                    userId: user.user_id,
                    username: user.username,
                    avatar: user.avatar,
                    email: user.email,
                    picture: user.picture,
                },
            });
        } else {
            user = await createUser(email, sub);

            return res.json({
                success: true,
                needsProfileCompletion: true,
                redirectTo: `/completa-profilo/${encodeURIComponent(email)}`,
            });
        }
    } catch (error) {
        console.error("Errore durante la verifica del token:", error);
        res.status(400).json({ success: false, error: "Invalid token" });
    }
});

const verifyGoogleToken = async (idToken) => {
    const clientGoogle = new OAuth2Client(
        "706006966723-3qafmigciao7oo5vguvhks4353i6cvhq.apps.googleusercontent.com"
    );
    const ticket = await clientGoogle.verifyIdToken({
        idToken: idToken,
        audience:
            "706006966723-3qafmigciao7oo5vguvhks4353i6cvhq.apps.googleusercontent.com",
    });

    return ticket.getPayload(); // Restituisce i dati dell'utente
};

// Funzione per trovare un utente nel database usando l'email
const findUserByGoogleId = async (googleId) => {
    const result = await client.query(
        "SELECT * FROM users WHERE google_id = $1",
        [googleId]
    );
    return result.rowCount > 0 ? result.rows[0] : null;
};

const createUser = async (email, googleId) => {
    const result = await client.query(
        "INSERT INTO users (email, password, google_id, verified) VALUES ($1, $2, $3, $4) RETURNING user_id, username, avatar",
        [email, googleId, googleId, true]
    );
    return result.rows[0];
};

const generateTokens = (userId, username) => {
    const payload = {
        userId: userId,
        username: username,
    };

    const secretKey = process.env.ACCESS_TOKEN_SECRET;
    const accessToken = jwt.sign(payload, secretKey, {
        expiresIn: "15m", // 15 minuti
    });

    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "15d", // 15 giorni
    });

    return { accessToken, refreshToken };
};

const setAuthCookies = (res, accessToken, refreshToken) => {
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("accesstoken", accessToken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000, // 15 minuti
        secure: isProduction,
        sameSite: "Strict",
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 15 * 24 * 3600 * 1000, // 15 giorni
        secure: isProduction,
        sameSite: "Strict",
    });
};

module.exports = router;
