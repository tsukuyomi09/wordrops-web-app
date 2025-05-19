const jwt = require("jsonwebtoken");
const { refreshAccessToken } = require("../utils/refreshAccessToken");

const checkOptionalAuth = async (req, res, next) => {
    const accesstoken = req.cookies.accesstoken;
    const refreshToken = req.cookies.refreshToken;
    const isProduction = process.env.NODE_ENV === "production";

    if (accesstoken) {
        try {
            const decoded = jwt.verify(
                accesstoken,
                process.env.ACCESS_TOKEN_SECRET
            );
            req.user_id = decoded.userId;
            req.username = decoded.username;
            req.isLoggedIn = true;
            return next();
        } catch (err) {
            // AccessToken non valido, proviamo con il refresh sotto
        }
    }

    // Se siamo qui, l'accessToken è mancante o scaduto
    if (refreshToken) {
        console.log(`refresh token: ${refreshToken}`);
        try {
            const decodedRefresh = jwt.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_SECRET
            );
            const newAccessToken = await refreshAccessToken(
                decodedRefresh.userId,
                decodedRefresh.username
            );

            res.cookie("accesstoken", newAccessToken, {
                httpOnly: true,
                maxAge: 15 * 60 * 1000,
                secure: isProduction,
                sameSite: "Strict",
            });

            req.user_id = decodedRefresh.userId;
            req.username = decodedRefresh.username;
            req.isLoggedIn = true;
            return next();
        } catch (err) {}
    }

    req.user_id = null;
    req.username = null;
    req.isLoggedIn = false;
    next();
};

module.exports = checkOptionalAuth;
