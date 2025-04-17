require("dotenv").config();

const express = require("express");
const path = require("path");
const http = require("http");
const { initSocket } = require("./src/services/socketManager");
const { connectDB } = require("./src/database/db");
const cookieParser = require("cookie-parser");
const { preGameQueue } = require("./src/routes/queueRoutesNew");
const { activeGames } = require("./src/services/gameManager");
const { client } = require("./src/database/db");

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

const port = process.env.PORT || 3000;

connectDB();

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
const chatReadMap = new Map();

io.on("connection", (socket) => {
    console.log("Nuovo client connesso:", socket.id);

    socket.on("disconnect", (reason) => {
        console.log("Disconnesso dal server per:", reason);
    });

    socket.on("text-update-animation", ({ gameId, username }) => {
        io.in(gameId).emit("text-update-animation", {
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
            // console.log("Contenuto di game:", game);

            if (!game) {
                console.error(`Gioco con ID ${gameId} non trovato`);
                return;
            }

            // Trova il giocatore specificato, confrontando con socketId
            const player = game.players.find((p) => p.socketId === userId); // Cambiato da p.id a p.socketId

            if (!player) {
                console.error(
                    `Giocatore con socketId ${userId} non trovato nel gioco ${gameId}`
                );
                return;
            }

            // Segna il giocatore come pronto
            player.pronto = true;
            // console.log(
            //     `Giocatore ${player.username} è pronto per il gioco ${gameId}`
            // );

            // Stampa lo stato aggiornato della preGameQueue
            // console.log(preGameQueue);
        } catch (error) {
            console.error(
                "Errore durante l'elaborazione dell'evento 'playerReady':",
                error
            );
        }
    });

    socket.on("sendChatMessage", (messageData) => {
        const { game_id, user_id, messageText } = messageData;
        console.log(
            `mage id: ${game_id} , user id: ${user_id} text: ${messageText}`
        );
        const game = activeGames.get(game_id);
        console.log("Turn order:", game.turnOrder);

        if (!game) return;

        const player = game.turnOrder.find((p) => {
            console.log(
                `Comparing user_id: ${user_id} with player id: ${p.id}`
            );
            return p.id === user_id;
        });
        console.log(`player: ${player}`);
        if (!player) return;

        const message = {
            userId: user_id,
            username: player.username,
            avatar: player.avatar,
            messageText: messageText,
            sentAt: new Date(),
        };

        // Salva il messaggio nel backend
        game.chat.push(message);
        console.log("Chat aggiornata:", game.chat);
        let gameChatMap = chatReadMap.get(game_id);
        if (!gameChatMap) {
            gameChatMap = new Map(); // Se non esiste ancora, creiamo una nuova mappa
            chatReadMap.set(game_id, gameChatMap);
        }

        // Aggiungi o aggiorna il timestamp dell'utente nella mappa del gioco
        gameChatMap.set(user_id, message.sentAt);

        // Emmetti il messaggio a tutti i client connessi alla stanza del gioco
        socket.to(game_id).emit("receiveChatMessage", {
            game_id: game_id,
            messageText: messageText,
            avatar: player.avatar,
            username: player.username,
            sentAt: new Date(),
        });
    });

    socket.on("chatRead", (data) => {
        const { game_id, user_id, readUntil } = data;

        if (!chatReadMap.has(game_id)) {
            // Se il gioco (chat) non è presente nella mappa, creiamo una nuova entry
            chatReadMap.set(game_id, new Map());
        }

        const gameChatMap = chatReadMap.get(game_id);
        gameChatMap.set(user_id, readUntil);

        console.log(
            `Updated read status for chat: ${game_id}, user: ${user_id}, readUntil: ${readUntil}`
        );
    });

    socket.on("chapterRead", ({ game_id, user_id, readUntil }) => {
        const game = activeGames.get(game_id);
        if (!game) return;

        const readMap = game.chapterReadMap;
        const previous = readMap.get(user_id);

        if (!previous || readUntil > previous) {
            readMap.set(user_id, readUntil);
            console.log(
                `Utente ${user_id} ha letto fino al capitolo con timestamp ${readUntil}`
            );
        }
    });

    socket.on("startGameCountdown", ({ gameId }) => {
        startGameCountdown(io, gameId);
    });

    socket.on("joinNewGame", ({ gameId, user_id }) => {
        socket.join(gameId);

        const game = activeGames.get(gameId);

        if (!game) {
            console.error(`Game with ID ${gameId} not found.`);
            return; // Interrompi l'esecuzione se il gioco non esiste
        }

        const gameChatMap = chatReadMap.get(gameId);

        const readMap = game.chapterReadMap || new Map();
        const readUntil = readMap.get(user_id);
        const lastRead = gameChatMap ? gameChatMap.get(user_id) : null;
        const lastMessage = game?.chat[game.chat.length - 1];
        const chapters = game?.chapters || [];

        let hasUnreadChapter = false;
        let allMessagesRead = false;

        if (chapters.length > 0) {
            const lastChapter = chapters[chapters.length - 1];
            const lastTimestamp = lastChapter.timestamp;

            // Se l'utente non ha ancora letto nulla, o ha letto fino a un timestamp più vecchio
            if (!readUntil || isNaN(readUntil) || readUntil < lastTimestamp) {
                hasUnreadChapter = true;
            }
        }

        if (game.chat.length > 0 && lastRead && lastMessage) {
            console.log(
                `Comparing last read (${new Date(
                    lastRead
                )}) with last message sentAt (${new Date(lastMessage.sentAt)})`
            );

            // Verifica se l'utente ha letto tutti i messaggi fino all'ultimo
            allMessagesRead =
                new Date(lastRead) >= new Date(lastMessage.sentAt);
            console.log(`All messages read: ${allMessagesRead}`);
        }

        if (game.chat.length === 0) {
            allMessagesRead = true; // Non c'è nulla da leggere
        }

        // Invia la chat e lo stato di lettura al client
        socket.emit("chatStatus", {
            allMessagesRead,
            chat: game?.chat || [],
            game_id: gameId,
        });

        socket.emit("chapterStatus", {
            game_id: gameId,
            hasUnreadChapter,
        });

        io.in(gameId).emit("playerJoined", {
            message: `A new player has joined the game ${gameId}`,
            socketId: socket.id,
        });
    });

    socket.on("updateChapterStatus", ({ game_id, user_id }) => {
        const game = activeGames.get(game_id);

        // Verifica che il gioco esista
        if (game) {
            // Ottieni l'ultimo capitolo del gioco
            const lastChapter = game?.chapters[game.chapters.length - 1];
            const lastChapterTimestamp = lastChapter
                ? lastChapter.timestamp
                : null;
            console.log(
                `Confronto dei timestamp per il gioco ${game_id}, utente ${user_id}:`
            );
            console.log(
                `Timestamp dell'ultimo capitolo: ${new Date(
                    lastChapterTimestamp
                )}`
            );

            // Aggiorna il timestamp dell'ultimo capitolo letto per l'utente
            game.chapterReadMap.set(user_id, lastChapterTimestamp);
            console.log(
                `Aggiornato il capitolo letto per l'utente ${user_id} nel gioco ${game_id}`
            );
        } else {
            console.error(`Gioco con ID ${game_id} non trovato.`);
        }
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
app.get("/register01", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "register01.html"));
});
app.get("/game", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "game.html"));
});
app.get("/gamequeue", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "gamequeue.html"));
});
app.get("/storie-community", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "storie-community.html"));
});
app.get("/classifiche", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "classifiche.html"));
});
app.get("/completa-profilo/:email", (req, res) => {
    const email = req.params.email;

    client.query(
        "SELECT * FROM users WHERE email = $1",
        [email],
        (err, result) => {
            if (err) {
                console.error("Errore nel recuperare i dati dell'utente", err);
                return res.status(500).send("Errore nel recupero dell'utente.");
            }

            if (result.rows.length === 0) {
                return res.status(404).send("Utente non trovato.");
            }

            // Se tutto va bene, mostra la pagina HTML
            res.sendFile(
                path.join(__dirname, "views", "completa-profilo.html")
            );
        }
    );
});
app.get("/image", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "image.html"));
});
app.get("/sitemap.xml", (req, res) => {
    res.sendFile(path.join(__dirname, "sitemap.xml"));
});

const waitingListRoute = require("./src/routes/waitingList");
const registerRoutes = require("./src/routes/registerRoutes");
const loginRoutes = require("./src/routes/loginRoutes");
const googleLogin = require("./src/routes/googleLogin");
const verifyEmail = require("./src/routes/verifyEmail");
const finishOnboarding = require("./src/routes/finishOnboarding");
const createProfileCheckUsername = require("./src/routes/createProfileCheckUsername");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const usersProfileRoute = require("./src/routes/usersProfileRoute");
const usersProfileData = require("./src/routes/usersProfileData");
const getPersonalLibrary = require("./src/routes/getPersonalLibrary");
const storyDetails = require("./src/routes/storyDetails");
const userDataRoutes = require("./src/routes/userData");
const queueRoutesNew = require("./src/routes/queueRoutesNew");
const searchUserRoute = require("./src/routes/searchUser");
const playersQueue = require("./src/routes/playersQueue");
const gameStatus = require("./src/routes/gameStatus");
const playerReady = require("./src/routes/playerReady");
const gameRoute = require("./src/routes/gameRoute");
const gameRouteData = require("./src/routes/gameData");
const gamesRouteData = require("./src/routes/gamesData");
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
app.use(googleLogin);
app.use(verifyEmail);
app.use(finishOnboarding);
app.use(createProfileCheckUsername);
app.use(dashboardRoutes);
app.use(usersProfileRoute);
app.use(getPersonalLibrary);
app.use(storyDetails);
app.use(userDataRoutes);
app.use(usersProfileData);
app.use(searchUserRoute);
app.use(queueRoutesNew);
app.use(gameStatus);
app.use(playerReady);
app.use(gameRoute);
app.use(saveChapterChangeTurn);
app.use(getChapters);
app.use(gameRouteData);
app.use(gamesRouteData);
app.use(playersQueue);
app.use(updateAvatar);

server.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
});
