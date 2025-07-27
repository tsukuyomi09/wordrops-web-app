const express = require("express");
const path = require("path");
const router = express.Router();
const { client } = require("../../database/db");
const { sendRegistrationEmail } = require("../../utils/registration-email");
const argon2 = require("argon2");
const crypto = require("crypto");

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

router.post("/", async (req, res) => {
    const { userEmail, userPassword, lang } = req.body;

    if (!userEmail || !userPassword) {
        return res.status(400).json({ message: "All fields are required." });
    }

    let hashedPassword;
    try {
        hashedPassword = await argon2.hash(userPassword, {
            type: argon2.argon2id,
            memoryCost: 19456,
            timeCost: 2,
            parallelism: 1,
        });
    } catch (err) {
        console.error("Error during password hashing");
        return res.status(500).json({ message: "Error during registration." });
    }

    try {
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const query =
            "INSERT INTO users (email, password, username, verification_token, lang) VALUES ($1, $2, $3, $4, $5) RETURNING *";
        const result = await client.query(query, [
            userEmail,
            hashedPassword,
            null,
            verificationToken,
            lang,
        ]);

        sendRegistrationEmail(userEmail, verificationToken);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error inserting into database", err);
        if (err.code === "23505") {
            return res
                .status(400)
                .json({ message: "Email is already in use." });
        } else {
            return res.status(500).json({ message: "Server error." });
        }
    }
});

module.exports = router;
