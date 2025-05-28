if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
const express = require("express");
const path = require("path");
const http = require("http");
const { initSocket } = require("./src/services/socketManager");
const { connectDB } = require("./src/database/db");
const cookieParser = require("cookie-parser");
// const { preGameQueue } = require("./src/routes/game/gameQueue");
const checkOptionalAuth = require("./src/middlewares/checkOptionalAuth");
const { storiaHandler } = require("./src/handlers/storiaHandler");
const {
    storieCommunityHandler,
} = require("./src/handlers/storieCommunityHandler");
const { sitemapGenerator } = require("./src/services/sitemapGenerator");
const { activeGames } = require("./src/services/gameManager");
const { client } = require("./src/database/db");
const {
    loadNotificationsIntoMap,
} = require("./src/services/notificationLoader");
const { loadPlayerStatsIntoMap } = require("./src/utils/usersStatsLoader");

const app = express();
app.get("/status", (req, res) => {
    res.status(200).send("OK");
});
const server = http.createServer(app);
const io = initSocket(server);

const port = process.env.PORT || 3000;

app.use(cookieParser());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
const chatReadMap = new Map();

io.on("connection", (socket) => {
    socket.on("disconnect", (reason) => {});

    socket.on("text-update-animation", ({ gameId, username }) => {
        io.in(gameId).emit("text-update-animation", {
            message: `${username} sta scrivendo`,
        });
    });

    // socket.on("playerReady", ({ gameId, userId }) => {
    //     try {
    //         if (!gameId || !userId) {
    //             return;
    //         }
    //         const game = preGameQueue[gameId];
    //         const player = game.players.find((p) => p.socketId === userId);

    //         if (!player) {
    //             return;
    //         }
    //         player.pronto = true;
    //     } catch (error) {
    //         console.error(
    //             "Errore durante l'elaborazione dell'evento 'playerReady':",
    //             error
    //         );
    //     }
    // });

    socket.on("sendChatMessage", (messageData) => {
        const { game_id, user_id, messageText } = messageData;
        const game = activeGames.get(game_id);

        if (!game) return;

        const player = game.players.find((p) => {
            return p.user_id === user_id;
        });

        if (!player) return;

        const message = {
            user_id: user_id,
            username: player.username,
            avatar: player.avatar,
            messageText: messageText,
            sentAt: new Date(),
        };

        // Salva il messaggio nel backend
        game.chat.push(message);
        let gameChatMap = chatReadMap.get(game_id);
        if (!gameChatMap) {
            gameChatMap = new Map();
            chatReadMap.set(game_id, gameChatMap);
        }

        gameChatMap.set(user_id, message.sentAt);

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
            chatReadMap.set(game_id, new Map());
        }

        const gameChatMap = chatReadMap.get(game_id);
        gameChatMap.set(user_id, new Date(readUntil));
    });

    socket.on("chapterRead", ({ game_id, user_id, readUntil }) => {
        const game = activeGames.get(game_id);
        if (!game) return;

        const readMap = game.chapterReadMap;
        const previous = readMap.get(user_id);

        if (!previous || readUntil > previous) {
            readMap.set(user_id, readUntil);
        }
    });

    socket.on("startGameCountdown", ({ gameId }) => {
        startGameCountdown(io, gameId);
    });

    socket.on("joinNewGame", ({ gameId, user_id }) => {
        socket.join(gameId);

        const game = activeGames.get(gameId);

        if (!game) {
            return;
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
            allMessagesRead =
                new Date(lastRead) >= new Date(lastMessage.sentAt);
        }

        if (game.chat.length === 0) {
            allMessagesRead = true;
        }

        console.log("[DEBUG read status]", {
            gameId,
            user_id,
            lastRead: lastRead ? lastRead.toISOString() : null,
            lastMessageSentAt: lastMessage
                ? new Date(lastMessage.sentAt).toISOString()
                : null,
            comparison:
                lastRead && lastMessage
                    ? lastRead >= new Date(lastMessage.sentAt)
                    : "n/a",
            gameChatLength: game.chat.length,
        });

        console.dir(
            Array.from(chatReadMap.entries()).map(([gameId, userMap]) => ({
                gameId,
                userMap: Array.from(userMap.entries()).map(
                    ([userId, timestamp]) => ({
                        userId,
                        timestamp,
                    })
                ),
            })),
            { depth: null }
        );

        socket.emit("chatStatus", {
            allMessagesRead,
            chat: game?.chat || [],
            game_id: gameId,
        });

        socket.emit("chapterStatus", {
            game_id: gameId,
            hasUnreadChapter,
        });
    });

    socket.on("updateChapterStatus", ({ game_id, user_id }) => {
        const game = activeGames.get(game_id);

        if (game) {
            const lastChapter = game?.chapters[game.chapters.length - 1];
            const lastChapterTimestamp = lastChapter
                ? lastChapter.timestamp
                : null;

            game.chapterReadMap.set(user_id, lastChapterTimestamp);
        } else {
            console.error(`Gioco con ID ${game_id} non trovato.`);
        }
    });

    socket.on("disconnect", () => {
        // Trova il gioco in cui è presente il socket.id
        for (const [gameId, game] of activeGames) {
            if (game.connections.includes(socket.id)) {
                // Rimuovi il socket.id dalla lista connections
                game.connections = game.connections.filter(
                    (conn) => conn !== socket.id
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
app.get("/dashboard/:user_id", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});
app.get("/privacy-policy", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "privacy-policy.html"));
});
app.get("/termini-e-condizioni", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "termini-e-condizioni.html"));
});
app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "register.html"));
});
app.get("/game/:gameId", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "game.html"));
});
app.get("/profile-page/:username", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "profile-page.html"));
});

app.get("/storie-community", storieCommunityHandler);

app.get("/storia/:id_slug", checkOptionalAuth, storiaHandler);

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
app.get("/404", (req, res) => {
    console.log("Route 404 chiamata");
    res.sendFile(path.join(__dirname, "views", "404.html"));
});
app.get("/sitemap.xml", sitemapGenerator);

const authRoute = require("./src/routes/auth");
const gameRoute = require("./src/routes/game");
const libraryRoute = require("./src/routes/library");
const storyRoute = require("./src/routes/story");
const communityRoute = require("./src/routes/community");
const onboardingRoute = require("./src/routes/onboarding");
const profileRoute = require("./src/routes/profile");
const searchRoute = require("./src/routes/search");
const leaderboardRoute = require("./src/routes/leaderboard");

app.use("/auth", authRoute);
app.use("/game", gameRoute);
app.use("/library", libraryRoute);
app.use("/story", storyRoute);
app.use("/community", communityRoute);
app.use("/onboarding", onboardingRoute);
app.use("/profile", profileRoute);
app.use("/search", searchRoute);
app.use("/leaderboard", leaderboardRoute);

(async () => {
    try {
        await connectDB();
        await loadNotificationsIntoMap();
        await loadPlayerStatsIntoMap();

        server.listen(port, "0.0.0.0", (err) => {
            if (err) {
                console.error("Failed to start server:", err);
                return;
            }
            console.log(`Server is running on port ${port}`);
        });
    } catch (err) {
        console.error("Failed during startup:", err);
        process.exit(1);
    }
})();

server.on("error", (err) => {
    console.error("An unexpected error occurred:", err.message);
});
