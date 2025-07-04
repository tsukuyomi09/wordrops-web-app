const jwt = require("jsonwebtoken");
const { refreshAccessToken } = require("../utils/refreshAccessToken");

const checkAuth = async (req, res, next) => {
    const accesstoken = req.cookies.accesstoken;
    const refreshToken = req.cookies.refreshToken;
    const isProduction = process.env.NODE_ENV === "production";

    if (!accesstoken) {
        if (!refreshToken) {
            return res
                .status(401)
                .json({ message: "Missing or invalid token." });
        }

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
            return next();
        } catch (err) {
            return res.status(401).json({ message: "Invalid refresh token." });
        }
    }

    try {
        const secretKey = process.env.ACCESS_TOKEN_SECRET;
        const decoded = jwt.verify(accesstoken, secretKey);

        req.user_id = decoded.userId;
        req.username = decoded.username;
        return next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            if (!refreshToken) {
                return res.status(401).json({
                    message: "Token expired and no refresh token available.",
                });
            }

            try {
                const decodedRefresh = jwt.verify(
                    refreshToken,
                    process.env.REFRESH_TOKEN_SECRET
                );

                const newAccessToken = await refreshAccessToken(
                    decodedRefresh.userId
                );

                res.cookie("accesstoken", newAccessToken, {
                    httpOnly: true,
                    maxAge: 15 * 60 * 1000,
                    secure: isProduction,
                    sameSite: "Strict",
                });
                req.user_id = decodedRefresh.userId;
                req.username = decodedRefresh.username;
                return next();
            } catch (err) {
                return res
                    .status(401)
                    .json({ message: "Invalid refresh token." });
            }
        }

        return res.status(401).json({ message: "Invalid token." });
    }
};

module.exports = checkAuth;
