const { client } = require("./database");
const { createSession } = require("./sessions")

const register = (req, res) => {

    let body = "";

    req.on("data", chunk => {
        body += chunk.toString();
    });

    req.on("end", () => {
        const {userEmail, userPassword, userName} = JSON.parse(body);
        console.log(`email: ${userEmail}`)
        console.log(`password: ${userPassword}`)
        console.log(`username: ${userName}`)

        if (!userName || !userEmail || !userPassword) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Tutti i campi sono richiesti." }));
        } 
        
        const query = "INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING *";
        client.query(query, [userEmail, userPassword, userName])
            .then(result => {
                console.log(`Nuovo utente registrato: ${userName}`);
                res.writeHead(201);
                res.end(JSON.stringify(result.rows[0])); // Restituisce i dati dell'utente registrato
            }) 
            .catch(err => { 
                console.error("Errore durante l'inserimento:", err);
                if (err.code === '23505') { // Codice di errore per violazione vincolo UNIQUE
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "L'email o il nome utente sono già in uso." }));
                } else {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Errore del server" }));
                }
            });
    })
}

const login = (req, res) => {
    let body = ""

    req.on("data", chunk => {
        body += chunk.toString();
    })

    
    req.on("end", () => {
        const {loginUserName, loginPassword} = JSON.parse(body);

        if (!loginUserName || !loginPassword){
            res.writeHead(400, { "Content-Type": "application/json" })
            return res.end("Fill up all fields")
        }
        const query = "SELECT user_id, password FROM users WHERE username = $1";
        client.query(query, [loginUserName])
            .then(result => {
 
                if (result.rows.length > 0 && result.rows[0].password === loginPassword) {
                    return createSession(result.rows[0].user_id)
                } else {
                    res.writeHead(401, {"Content-Type": "application/json"});
                    return res.end("Invalid Credentials")
                }
            })

            .then(sessionId => {
                console.log(`Nuovo Login: ${loginUserName}`);
                console.log(`sessionId: ${sessionId}`);
                res.writeHead(200, { 
                    "Content-Type": "application/json",
                    "Set-Cookie": `sessionId=${sessionId}; HttpOnly; Max-Age=3600;`
                });
                res.end(JSON.stringify({ message: "You are now logged in", redirectUrl: "/public/main.html"})); 
            })
            .catch(err => {
                // Gestione degli errori nel caso di fallimento della query
                console.error("Error during login:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Errore del server" }));
            });
    });
}

module.exports = { register, login }; 