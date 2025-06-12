const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const sendWaitingListEmail = async (userEmail, name) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.zoho.eu",
        port: 465,
        secure: true,
        auth: {
            user: "noreply@wordrops.com",
            pass: process.env.ZOHO_SMTP_PASS,
        },
    });

    const isProduction = process.env.NODE_ENV === "production";
    const baseUrl = isProduction
        ? "https://wordrops.com"
        : "http://localhost:3000";

    const imagePath = path.join(
        __dirname,
        "..",
        "..",
        "public",
        "images",
        "logo_wordrops_classic_blue.png"
    );

    const mailOptions = {
        from: '"Wordrops Team" <noreply@wordrops.com>',
        to: userEmail,
        subject: "🎉 Sei nella waiting list di Wordrops!",
        text: `Ciao ${name}!`,
        html: `
            <img src="cid:wordropsLogo" alt="Wordrops" width="120" />
            <h2>🎉 Grazie per l'iscrizione!</h2>
            <p>Ciao ${name}! Sei ufficialmente registrato come beta tester. Ti invieremo una notifica quando sarà il tuo turno per accedere e provare <strong>Wordrops</strong>.</p>
            <br/>
            <small>Questa è un'email automatica inviata da Wordrops. Non rispondere a questo indirizzo.</small>
        `,
        attachments: [
            {
                filename: "logo_wordrops_classic_blue.png",
                path: imagePath,
                cid: "wordropsLogo",
            },
        ],
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Errore nell'invio dell'email:", error);
    }
};

module.exports = { sendWaitingListEmail };
