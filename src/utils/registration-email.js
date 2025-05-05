const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const sendRegistrationEmail = async (userEmail, verificationToken) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.zoho.eu",
        port: 465,
        secure: true,
        auth: {
            user: "noreply@wordrops.com",
            pass: "JXfigN73LePZ",
        },
    });

    const isProduction = process.env.NODE_ENV === "production";

    const baseUrl = isProduction
        ? "https://wordrops.com"
        : "http://localhost:3000";

    const verificationUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`;

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
        subject: "🎉 Benvenuto su wordrops.com!",

        text: `Per completare la registrazione, clicca sul link qui sotto per verificare il tuo indirizzo email:\n\n${verificationUrl}\n\nQuesta è un'email automatica inviata da Wordrops. Non rispondere a questo indirizzo.`,

        html: `
            <div style="font-family: sans-serif; color: #333;">
                <img src="cid:wordropsLogo" alt="Wordrops" width="120" />
                <p>Per completare la registrazione, clicca sul link qui sotto per verificare il tuo indirizzo email:</p>
                <p><a href="${verificationUrl}">${verificationUrl}</a></p>
                <br />
                <small>Questa è un'email automatica inviata da Wordrops. Non rispondere a questo indirizzo.</small>
            </div>
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

module.exports = { sendRegistrationEmail };
