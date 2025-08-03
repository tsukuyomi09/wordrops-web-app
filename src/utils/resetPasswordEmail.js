const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const sendResetPasswordEmail = async (userEmail, resetLink) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.zoho.eu",
        port: 465,
        secure: true,
        auth: {
            user: "noreply@wordrops.com",
            pass: process.env.ZOHO_SMTP_PASS,
        },
    });

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
        subject: "Reset your Wordrops password",
        text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nThis link expires in 15 minutes.`,
        html: `
      <div style="font-family: sans-serif; color: #333;">
        <img src="cid:wordropsLogo" alt="Wordrops" width="120" />
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <br />
        <small>This link will expire in 15 minutes. If you didn't request this, ignore this email.</small>
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
        console.error("Error sending reset email:", error);
        throw new Error("Failed to send reset email");
    }
};

module.exports = { sendResetPasswordEmail };
