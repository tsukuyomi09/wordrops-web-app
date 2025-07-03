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
        console.error("Error generating new access token:", err);
        throw new Error("Error generating new access token");
    }
};

module.exports = { refreshAccessToken };
