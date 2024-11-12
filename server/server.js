const http = require("http");
const PORT = 3000;
const { connectDB } = require("./database");
const getRoutes = require("./register");
const logRoutes = require("./login");
const itemRoutes = require("./items");
const checkSession = require("./checksession")
const allowedOrigin = "http://127.0.0.1:5500";
const { joinQueue } = require("./queue")


connectDB();

const server = http.createServer((req, res) => {

    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // Gestisci le richieste OPTIONS
    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }

    // Rotte che non richiedono autenticazione
    if (req.method === "POST" && req.url === "/login") {
        logRoutes.login(req, res);
    } else if (req.method === "POST" && req.url === "/register") {
        getRoutes.register(req, res);
    } else if (req.method === "GET" && req.url === "/verifyuser") {
        // Verifica la sessione per questa richiesta GET
        checkSession(req, res, () => {
            // Se la sessione è valida, non fare nulla, rispondi con un OK
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "User authenticated" }));
        });
    } else {
        // Applica il controllo sessione (middleware) per tutte le altre rotte protette
        checkSession(req, res, () => {

            if (req.method === "POST" && req.url === "/items") {
                itemRoutes.createItem(req, res);
            } else if (req.method === "GET" && req.url === "/items") {
                itemRoutes.getItems(req, res);
            } else if (req.method === "DELETE" && req.url.startsWith("/items/")) {
                itemRoutes.deleteItem(req, res);
            } else if (req.method === "POST" && req.url === "/queue") {
                console.log("Ricevuta richiesta POST per queue");
                joinQueue(req, res);
            } else {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("Not Found");
            }
        });
    }
});

server.listen(PORT, () => {
    console.log(`Server in ascolto alla porta ${PORT}`)
})


