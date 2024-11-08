const http = require("http");
const cookie = require("cookie");
const PORT = 3000;
const { connectDB } = require("./database");
const authRoutes = require("./auth");
const itemRoutes = require("./items");
const allowedOrigin = "http://127.0.0.1:5500";


connectDB();

const server = http.createServer((req, res) => {

    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");


    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === "POST" && req.url === "/items") {
        itemRoutes.createItem(req, res); // Usa la funzione per creare un item
    } else if (req.method === "GET" && req.url === "/items") {
        itemRoutes.getItems(req, res); // Usa la funzione per ottenere items
    } else if (req.method === "DELETE" && req.url.startsWith("/items/")) {
        itemRoutes.deleteItem(req, res); // Usa la funzione per eliminare un item
    } else if (req.method === "POST" && req.url === "/register") {
        authRoutes.register(req, res); // Assicurati di avere una funzione di registrazione in auth.js
    } else if (req.method === "POST" && req.url === "/login") {
        authRoutes.login(req, res); // Assicurati di avere una funzione di registrazione in auth.js
    }else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    }
});

server.listen(PORT, () => {
    console.log(`Server in ascolto alla porta ${PORT}`)
})


