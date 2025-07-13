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
const privacyTranslations = require("./locales/privacyPageTranslations");
const termsAndConditionsTranslations = require("./locales/termsAndConditionsPageTranslations");

function getPrivacyTranslations(lang) {
    return (
        privacyTranslations.privacyPolicy[lang] ||
        privacyTranslations.privacyPolicy.en
    );
}

function getTermsTranslations(lang) {
    return (
        termsAndConditionsTranslations.termsAndConditions[lang] ||
        termsAndConditionsTranslations.termsAndConditions.en
    );
}

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
            message: `${username} is writing`,
        });
    });

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
            console.error(`Game ${game_id} not found.`);
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
app.get("/it", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "homepage-it.html"));
});
app.get("/es", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "homepage-es.html"));
});

app.get("/dashboard/:user_id", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});
app.get("/privacy-policy", (req, res) => {
    const lang = req.query.lang || "en";
    const texts = getPrivacyTranslations(lang);
    res.render("privacy-policy", { texts, lang });
});
app.get("/terms-and-conditions", (req, res) => {
    const lang = req.query.lang || "en";
    const texts = getTermsTranslations(lang);
    res.render("terms-and-conditions", { texts, lang });
});

// we keep the register page hidden for now
app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "register.html"));
});
app.get("/game/:gameId", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "game.html"));
});
app.get("/profile-page/:username", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "profile-page.html"));
});

app.get("/stories-library", storieCommunityHandler);

app.get("/story/:game_lang/:id_slug", checkOptionalAuth, storiaHandler);

app.get("/leaderboards", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "leaderboards.html"));
});

app.get("/complete-profile/:email", (req, res) => {
    const email = req.params.email;

    client.query(
        "SELECT * FROM users WHERE email = $1",
        [email],
        (err, result) => {
            if (err) {
                console.error("Error retrieving user data", err);
                return res.status(500).send("Error retrieving user..");
            }

            if (result.rows.length === 0) {
                return res.status(404).send("User not found.");
            }

            // Se tutto va bene, mostra la pagina HTML
            res.sendFile(
                path.join(__dirname, "views", "complete-profile.html")
            );
        }
    );
});
app.get("/404", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "404.html"));
});
app.get("/admin-panel", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "admin-panel.html"));
});
app.get("/sitemap.xml", sitemapGenerator);

const authRoute = require("./src/routes/auth");
const adminRoute = require("./src/routes/admin");
const gameRoute = require("./src/routes/game");
const libraryRoute = require("./src/routes/library");
const storyRoute = require("./src/routes/story");
const communityRoute = require("./src/routes/community");
const onboardingRoute = require("./src/routes/onboarding");
const profileRoute = require("./src/routes/profile");
const searchRoute = require("./src/routes/search");
const leaderboardRoute = require("./src/routes/leaderboard");

app.use("/auth", authRoute);
app.use("/admin", adminRoute);
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
