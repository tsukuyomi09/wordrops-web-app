const jwt = require("jsonwebtoken");

const refreshAccessToken = async (userId, username) => {
    try {
        const payload = { userId, username };
        const newAccessToken = jwt.sign(
            payload,
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "15m",
            }
        );

        return newAccessToken;
    } catch (err) {
        console.error("Errore nella generazione del nuovo access token:", err);
        throw new Error("Errore nella generazione del nuovo access token");
    }
};

module.exports = { refreshAccessToken };
