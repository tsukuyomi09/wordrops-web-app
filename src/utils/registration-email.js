const nodemailer = require("nodemailer");

// Funzione per inviare l'email
const sendWelcomeEmail = async (userEmail, verificationToken) => {
    // Configurazione del trasportatore per Gmail (può essere anche un altro provider)
    const transporter = nodemailer.createTransport({
        host: "smtp.zoho.eu", // oppure smtp.zoho.com se non sei su EU
        port: 465,
        secure: true, // true per SSL
        auth: {
            user: "noreply@wordrops.com",
            pass: "JXfigN73LePZ",
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
        from: '"Wordrops Team" <noreply@wordrops.com>',
        to: userEmail,
        subject: "🎉 Sei nella waiting list di Wordrops!",
        text: `Ciao! Per completare la registrazione, clicca sul link qui sotto per verificare il tuo indirizzo email:\n\n${verificationUrl}\n\n
    Grazie per esserti iscritto! Ti avviseremo quando sarà il tuo turno per accedere alla beta di Wordrops.`,
        html: `
            <h2>🎉 Grazie per esserti iscritto!</h2>
            <p>Sei ufficialmente nella nostra waiting list. Ti invieremo una notifica quando sarà il tuo turno per accedere alla beta di <strong>Wordrops</strong>.</p>
            <br/>
            <small>Questa è un'email automatica inviata da Wordrops. Non rispondere a questo indirizzo.</small>
        `,
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
