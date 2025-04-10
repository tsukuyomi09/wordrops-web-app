const nodemailer = require("nodemailer");

// Funzione per inviare l'email
const sendWelcomeEmail = async (userEmail, verificationToken) => {
    // Configurazione del trasportatore per Gmail (può essere anche un altro provider)
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "samuelesala9999@gmail.com", // Sostituisci con il tuo indirizzo email
            pass: "ivwz spph hpfb orob", // Sostituisci con la tua password o una password specifica per app
        },
    });

    const isProduction = process.env.NODE_ENV === "production";

    // URL del sito di verifica, dipende dall'ambiente
    const baseUrl = isProduction
        ? "https://wordrops.com" // Produzione
        : "http://localhost:3000";

    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

    // Opzioni per l'email
    const mailOptions = {
        from: "samuelesala9999@gmail.com",
        to: userEmail, // L'email dell'utente che si è appena registrato
        subject: "Welcome nella nostra piattaforma!",
        text: `Ciao! Per completare la registrazione, clicca sul link qui sotto per verificare il tuo indirizzo email:\n\n${verificationUrl}`,
    };

    // Invia l'email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email inviata:", info.response);
    } catch (error) {
        console.error("Errore nell'invio dell'email:", error);
    }
};

module.exports = { sendWelcomeEmail };
