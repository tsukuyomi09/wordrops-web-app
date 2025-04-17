const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Funzione per inviare l'email
const sendWelcomeEmail = async (userEmail, verificationToken) => {
    // Configurazione del trasportatore per Zoho SMTP
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

    // Percorso dell'immagine sul server
    const imagePath = path.join(
        __dirname,
        "..",
        "..",
        "public",
        "images",
        "logo_wordrops_classic_blue.png"
    );

    // Opzioni per l'email
    const mailOptions = {
        from: '"Wordrops Team" <noreply@wordrops.com>',
        to: userEmail,
        subject: "🎉 Sei nella waiting list di Wordrops!",
        text: `Ciao! Per completare la registrazione, clicca sul link qui sotto per verificare il tuo indirizzo email:\n\n${verificationUrl}\n\n
    Grazie per esserti iscritto! Ti avviseremo quando sarà il tuo turno per accedere alla beta di Wordrops.`,
        html: `
            <img src="cid:wordropsLogo" alt="Wordrops" width="120" />
            <h2>🎉 Grazie per esserti iscritto!</h2>
            <p>Sei ufficialmente nella nostra waiting list. Ti invieremo una notifica quando sarà il tuo turno per accedere alla beta di <strong>Wordrops</strong>.</p>
            <br/>
            <small>Questa è un'email automatica inviata da Wordrops. Non rispondere a questo indirizzo.</small>
        `,
        attachments: [
            {
                filename: "logo_wordrops_classic_blue.png",
                path: imagePath, // Percorso dell'immagine sul server
                cid: "wordropsLogo", // ID CID, deve corrispondere al src nell'HTML
            },
        ],
    };

    // Invia l'email
    try {
        await transporter.sendMail(mailOptions);
        console.log("Email inviata con successo!");
    } catch (error) {
        console.error("Errore nell'invio dell'email:", error);
    }
};

module.exports = { sendWelcomeEmail };
