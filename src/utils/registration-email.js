const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const sendRegistrationEmail = async (userEmail, verificationToken) => {
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

    const verificationUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`;

    const imagePath = path.join(
        __dirname,
        "..",
        "..",
        "public",
        "images",
        "email_logo.png"
    );

    const mailOptions = {
        from: '"Wordrops Team" <noreply@wordrops.com>',
        to: userEmail,
        subject: "🎉 Welcome to wordrops.com!",

        text: `To complete your registration, click the link below to verify your email address:\n\n${verificationUrl}\n\nThis is an automated email sent by Wordrops. Do not reply to this address.`,

        html: `
            <div style="font-family: sans-serif; color: #333;">
                <img src="cid:wordropsLogo" alt="Wordrops" width="120" />
                <p>To complete your registration, click the link below to verify your email address:</p>
                <p><a href="${verificationUrl}">${verificationUrl}</a></p>
                <br />
                <small>This is an automated email sent by Wordrops. Do not reply to this address.</small>
            </div>
        `,

        attachments: [
            {
                filename: "email_logo.png",
                path: imagePath,
                cid: "wordropsLogo",
            },
        ],
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

module.exports = { sendRegistrationEmail };
