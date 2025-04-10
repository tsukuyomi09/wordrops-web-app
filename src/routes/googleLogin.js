const express = require("express");
const router = express.Router();

const { OAuth2Client } = require("google-auth-library");

// Inizializza il client Google con il tuo client ID
const clientGoogle = new OAuth2Client(
    "706006966723-3qafmigciao7oo5vguvhks4353i6cvhq.apps.googleusercontent.com"
);

// Route per gestire la verifica del token
router.post("/google-login", async (req, res) => {
    const { idToken } = req.body; // Ottieni il token dal corpo della richiesta

    try {
        // Verifica il token
        const ticket = await clientGoogle.verifyIdToken({
            idToken: idToken,
            audience:
                "706006966723-3qafmigciao7oo5vguvhks4353i6cvhq.apps.googleusercontent.com",
        });

        const payload = ticket.getPayload(); // Ottieni le informazioni dell'utente

        console.log("Dati utente ricevuti da Google:", payload);

        // Dettagli che ricevi nel payload (sono solo alcuni esempi, potrebbero esserci anche altri campi)
        console.log("ID utente (sub):", payload.sub);
        console.log("Nome completo:", payload.name);
        console.log("Nome:", payload.given_name);
        console.log("Cognome:", payload.family_name);
        console.log("Email:", payload.email);
        console.log("URL immagine del profilo:", payload.picture);
        console.log("Lingua:", payload.locale);

        // Qui puoi inserire il tuo codice per la gestione dell'utente (verifica o creazione nel database)

        // Rispondi con un successo (o errori se necessario)
        res.json({ success: true, user: payload });
    } catch (error) {
        console.error("Errore durante la verifica del token:", error);
        res.status(400).json({ success: false, error: "Invalid token" });
    }
});

module.exports = router;
