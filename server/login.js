const { client } = require("./database");
const { createSession } = require("./sessions")
const argon2 = require('argon2');


async function getUserByUsername(username) {
    const query = "SELECT user_id, password FROM users WHERE username = $1";
    const result = await client.query(query, [username]);
    if (result.rows.length === 0) {
        throw new Error('Invalid Credentials');
    }
    return result.rows[0];
}

async function verifyPassword(storedHash, loginPassword) {
    const passwordMatch = await argon2.verify(storedHash, loginPassword);
    if (!passwordMatch) {
        throw new Error('Invalid Credentials');
    }
}

async function createLoginSession(user_id) {
    const sessionId = await createSession(user_id);
    return sessionId;
}

const login = async (req, res) => {
    let body = "";

    req.on("data", chunk => {
        body += chunk.toString();
    });

    req.on("end", async () => {
        const { loginUserName, loginPassword } = JSON.parse(body);

        if (!loginUserName || !loginPassword) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Fill up all fields" }));
        }

        try {
            // Step 1: Ottieni l'utente dal database
            const user = await getUserByUsername(loginUserName);
            
            // Step 2: Verifica la password
            await verifyPassword(user.password, loginPassword);
            
            // Step 3: Crea la sessione
            const sessionId = await createLoginSession(user.user_id);
            
            // Step 4: Imposta il cookie e rispondi
            res.writeHead(200, {
                "Content-Type": "application/json",
                "Set-Cookie": `sessionId=${sessionId}; HttpOnly; Max-Age=3600;`
            });
            res.end(JSON.stringify({ message: "Login effettuato", redirectUrl: "/public/main.html" }));
        } catch (err) {
            console.error("Errore durante il login:", err);
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: err.message || "Errore del server" }));
        }
    });
}

module.exports = { login }; 