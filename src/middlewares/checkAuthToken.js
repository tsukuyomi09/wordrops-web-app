const jwt = require('jsonwebtoken'); // Assicurati di installare il pacchetto jwt


const checkAuth = (req, res, next) => {
    const token = req.cookies.token; // Ottieni il token dai cookie (o header Authorization)

    if (!token) {
        return res.status(401).json({ message: "Token mancante o non valido." });
    }

    try {
        const secretKey = process.env.ACCESS_TOKEN_SECRET;

        const decoded = jwt.verify(token, secretKey);
        console.log("Decoded token:", decoded);
        req.user_id = decoded.userId;  
        req.username = decoded.username;

        next();
    } catch (err) {
        console.error("Errore nella verifica del token:", err);
        return res.status(401).json({ message: "Token non valido o scaduto." });
    }
};

module.exports = checkAuth;

