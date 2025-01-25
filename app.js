require("dotenv").config();

const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const { connectDB } = require("./src/database/db");
const cookieParser = require("cookie-parser");
const { preGameQueue } = require("./src/routes/queueRoutesNew");
const { activeGames } = require("./src/services/gameManager");

const app = express();
const server = http.createServer(app);
const { initSocket } = require("./src/services/socketManager");
const io = initSocket(server);

const port = process.env.PORT || 3000;

connectDB();

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

io.on("connection", (socket) => {
    console.log("Nuovo client connesso:", socket.id);

    socket.on("disconnect", (reason) => {
        console.log("Disconnesso dal server per:", reason);
    });

    socket.on("text-update-animation", ({ gameId, username }) => {
        io.in(Number(gameId)).emit("text-update-animation", {
            message: `${username} sta scrivendo`,
        });
    });

    socket.on("playerReady", ({ gameId, userId }) => {
        try {
            console.log("Messaggio ricevuto: playerReady");

            // Verifica che gameId e userId siano presenti
            if (!gameId || !userId) {
                console.error("gameId o userId mancante");
                return;
            }

            // Trova il gioco specificato
            const game = preGameQueue[gameId];

            if (!game) {
                console.error(`Gioco con ID ${gameId} non trovato`);
                return;
            }

            // Trova il giocatore specificato, confrontando con socketId
            const player = game.find((p) => p.socketId === userId); // Cambiato da p.id a p.socketId

            if (!player) {
                console.error(
                    `Giocatore con socketId ${userId} non trovato nel gioco ${gameId}`
                );
                return;
            }

            // Segna il giocatore come pronto
            player.pronto = true;
            console.log(
                `Giocatore ${player.username} è pronto per il gioco ${gameId}`
            );

            // Stampa lo stato aggiornato della preGameQueue
            console.log(preGameQueue);
        } catch (error) {
            console.error(
                "Errore durante l'elaborazione dell'evento 'playerReady':",
                error
            );
        }
    });

    socket.on("startGameCountdown", ({ gameId }) => {
        startGameCountdown(io, gameId);
    });

    socket.on("joinNewGame", ({ gameId }) => {
        console.log(`gameId ricevuto dal client:`, gameId); // Log del valore originale
        gameId = Number(gameId);
        console.log(`gameId convertito in numero:`, gameId);
        console.log(`Socket ${socket.id} si è unito al gioco ${gameId}`);
        socket.join(gameId);

        setTimeout(() => {
            const connectedSockets = io.sockets.adapter.rooms.get(gameId);
            console.log(
                `Client connessi alla stanza ${gameId} dopo un ritardo:`,
                connectedSockets
                    ? Array.from(connectedSockets)
                    : "Nessun client connesso"
            );
        }, 50);

        console.log(
            `Sta per essere emesso 'playerJoined' nella stanza ${gameId} con i seguenti dati:`,
            {
                message: `Un nuovo giocatore si è unito alla stanza ${gameId}`,
                socketId: socket.id,
            }
        );

        io.in(gameId).emit("playerJoined", {
            message: `Un nuovo giocatore si è unito alla stanza ${gameId}`,
            socketId: socket.id,
        });
    });

    socket.on("disconnect", () => {
        console.log(`Socket ${socket.id} disconnesso`);

        // Trova il gioco in cui è presente il socket.id
        for (const [gameId, game] of activeGames) {
            if (game.connections.includes(socket.id)) {
                // Rimuovi il socket.id dalla lista connections
                game.connections = game.connections.filter(
                    (conn) => conn !== socket.id
                );
                console.log(`Socket ${socket.id} rimosso dal gioco ${gameId}`);
                console.log(
                    `Connessioni aggiornate per il gioco ${gameId}:`,
                    game.connections
                );
                break; // Una volta trovato e aggiornato, non serve continuare
            }
        }
    });
});

app.use((req, res, next) => {
    req.io = io;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "homepage.html"));
});
app.get("/privacy-policy", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "privacy-policy.html"));
});
app.get("/register19090903", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "register19090903.html"));
});
app.get("/game", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "game.html"));
});
app.get("/gamequeue", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "gamequeue.html"));
});
app.get("/libreria", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "libreria.html"));
});
app.get("/classifiche", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "classifiche.html"));
});
app.get("/image", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "image.html"));
});

const waitingListRoute = require("./src/routes/waitingList");
const registerRoutes = require("./src/routes/registerRoutes");
const loginRoutes = require("./src/routes/loginRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const usersProfileRoute = require("./src/routes/usersProfileRoute");
const usersProfileData = require("./src/routes/usersProfileData");
const getPersonalLibrary = require("./src/routes/getPersonalLibrary");
const userDataRoutes = require("./src/routes/userData");
const queueRoutes = require("./src/routes/queueRoutes");
const queueRoutesNew = require("./src/routes/queueRoutesNew");
const searchUserRoute = require("./src/routes/searchUser");
const playersQueue = require("./src/routes/playersQueue");
const gameStatus = require("./src/routes/gameStatus");
const playerReady = require("./src/routes/playerReady");
const gameRoute = require("./src/routes/gameRoute");
const gameRouteData = require("./src/routes/gameData");
const saveChapterChangeTurn = require("./src/routes/saveChapterChangeTurn");
const getChapters = require("./src/routes/getChapters");
const verifyLogIn = require("./src/routes/verifyLogIn");
const logout = require("./src/routes/logout");
const updateAvatar = require("./src/services/updateAvatar");

app.use(logout);
app.use(waitingListRoute);
app.use(verifyLogIn);
app.use(registerRoutes);
app.use(loginRoutes);
app.use(dashboardRoutes);
app.use(usersProfileRoute);
app.use(getPersonalLibrary);
app.use(userDataRoutes);
app.use(usersProfileData);
app.use(searchUserRoute);
app.use(queueRoutes);
app.use(queueRoutesNew);
app.use(gameStatus);
app.use(playerReady);
app.use(gameRoute);
app.use(saveChapterChangeTurn);
app.use(getChapters);
app.use(gameRouteData);
app.use(playersQueue);
app.use(updateAvatar);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
