const { client } = require("./database");
const { sendWelcomeEmail } = require("./email-service");
const argon2 = require('argon2');

const register = async (req, res) => {

    let body = "";

    req.on("data", chunk => {
        body += chunk.toString();
    });

    req.on("end", async () => {
        const {userEmail, userPassword, userName} = JSON.parse(body);
        console.log(`email: ${userEmail}`)
        console.log(`password: ${userPassword}`)
        console.log(`username: ${userName}`)

        if (!userName || !userEmail || !userPassword) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Tutti i campi sono richiesti." }));
        } 

        let hashedPassword;

        try {
            hashedPassword = await argon2.hash(userPassword, {
                type: argon2.argon2id,    
                memoryCost: 19456,        
                timeCost: 2,         
                parallelism: 1 
            });
        } catch (err) {
            console.error("Errore durante hashing");
            res.writeHead(500, {"Content-type": "application/json"})
            return res.end(JSON.stringify({message: "Errore durante la registrazione"}))

        }

        try {
            const query = "INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING *";
            const result = await client.query(query, [userEmail, hashedPassword, userName])
            console.log(`Nuovo utente registrato: ${userName}`);
            sendWelcomeEmail(userEmail, userName);
            res.writeHead(201);
            res.end(JSON.stringify(result.rows[0])); // Restituisce i dati dell'utente registrato
        } catch (err) {
            console.error("Errore durante inserimento database", err);
            if (err.code === "23505"){
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "L'email o il nome utente sono già in uso." }));
            } else {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Errore del server." }));
            }
        }
})};


module.exports = { register }; 