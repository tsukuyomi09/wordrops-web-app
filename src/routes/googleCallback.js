const express = require("express");
const router = express.Router();

router.get("/google-callback", async (req, res) => {
    const code = req.query.code; // Il codice che Google invia nel callback

    try {
        // Scambia il codice con un access token
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens); // Salva il token

        // Ottieni le informazioni dell'utente
        const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
        const userInfo = await oauth2.userinfo.get();

        // Esegui ciò che desideri con le informazioni dell'utente (ad esempio registrare o autenticare l'utente nel tuo sistema)
        console.log(userInfo.data); // Qui ottieni i dati dell'utente

        // Puoi redirigere l'utente dove preferisci (ad esempio dashboard o profilo)
        res.redirect(`/dashboard/${userInfo.data.id}`);
    } catch (error) {
        console.error("Errore durante la gestione del callback:", error);
        res.status(500).send("Errore durante la gestione del callback");
    }
});

module.exports = router;
