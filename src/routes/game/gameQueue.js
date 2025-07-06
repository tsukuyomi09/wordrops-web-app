const express = require("express");
const router = express.Router();
const { createGameAndAssignPlayers } = require("../../services/gameManager");
const checkAuth = require("../../middlewares/checkAuthToken");
const checkUserStatus = require("../../middlewares/checkUserStatus");
const {
    gameQueues,
    playerQueuePosition,
    preGameQueue,
} = require("../../services/gameQueueData");

router.post("/", checkAuth, checkUserStatus, (req, res) => {
    const {
        socketId,
        avatarForGame: avatar,
        gameType,
        gameSpeed,
        gameLang,
    } = req.body;
    const { user_id, username, maxGamesReached } = req;
    const socket = req.io.sockets.sockets.get(socketId);

    if (maxGamesReached) {
        return res.status(403).json({
            error: "Max games limit reached",
        });
    }

    if (!user_id || playerQueuePosition[user_id] || !socket) {
        return res
            .status(user_id ? (playerQueuePosition[user_id] ? 400 : 500) : 401)
            .json({
                error: !user_id
                    ? "User not authenticated"
                    : playerQueuePosition[user_id]
                    ? "User already in queue"
                    : "Connection error. Please try again later.",
            });
    }

    player = {
        user_id,
        username,
        avatar,
        socketId,
        gameType,
        gameSpeed,
        gameLang,
        timestamp: Date.now(),
        pronto: true,
    };

    const queue = gameQueues[gameType][gameSpeed][gameLang];
    queue.enqueue(player);
    const players = queue.checkAndCreateGame();
    playerQueuePosition[user_id] = { gameType, gameSpeed, gameLang };

    logActiveQueues();

    if (players) {
        const gameId = `${gameLang}_${gameType}_${gameSpeed}:${Date.now()}`;
        preGameQueue[gameId] = {
            gameType,
            gameSpeed,
            gameLang,
            players,
        };
        players.forEach((player) => {
            const socket = req.io.sockets.sockets.get(player.socketId);
            if (socket) {
                socket.join(gameId);
                socket.emit("gameIdAssigned", { gameId });
            }
        });
        setTimeout(() => {
            startCountdownPreGame(req.io, gameId);
        }, 1000);
        return res.status(200).json({ message: "User in pre-game" });
    } else {
        setTimeout(() => {
            socket.emit("in-queue", "Waiting for more players");
        }, 1000);
        return res.status(200).json({ message: "User added to queue" });
    }
});

router.delete("/", checkAuth, async (req, res) => {
    const user_id = req.user_id;
    const socketId = req.body.socketId;
    const player = playerQueuePosition[user_id];
    const socket = req.io.sockets.sockets.get(socketId);

    if (!player) {
        return res
            .status(400)
            .json({ error: "Utente non trovato in nessuna coda" });
    }

    delete playerQueuePosition[user_id];
    const queue =
        gameQueues[player.gameType][player.gameSpeed][player.gameLang];
    queue.removePlayer(user_id);

    logActiveQueues();

    if (socket) {
        socket.emit("queueAbandoned", {
            status: "idle",
            message: "Hai abbandonato la coda",
        });
    }
    res.json({
        status: "idle",
        message: "Utente rimosso dalla coda",
    });
});

async function startCountdownPreGame(io, gameId) {
    let countdown = 10;

    const preGameCountdownInterval = setInterval(async () => {
        io.to(gameId).emit("countdown", countdown);

        if (countdown <= 0) {
            clearInterval(preGameCountdownInterval);
            const game = preGameQueue[gameId];

            if (game) {
                const { gameId: newGameId, turnOrder } =
                    await createGameAndAssignPlayers(game);
                const players = game.players;
                delete preGameQueue[gameId];
                players.forEach((player) => {
                    delete playerQueuePosition[player.user_id];
                });

                io.to(gameId).emit("game-start", {
                    message: "Game started",
                    gameId: newGameId,
                    turnOrder: turnOrder,
                });
            }
        } else {
            countdown--;
        }
    }, 1000);
}

function logActiveQueues() {
    console.log("----- STATO COMPLETO DELLE CODE -----");
    for (const gameType in gameQueues) {
        for (const gameSpeed in gameQueues[gameType]) {
            for (const gameLang in gameQueues[gameType][gameSpeed]) {
                const queue = gameQueues[gameType][gameSpeed][gameLang];
                const players = queue.toArray().map((p, index) => ({
                    pos: index + 1,
                    user_id: p.user_id,
                    username: p.username,
                    socketId: p.socketId,
                    timestamp: new Date(p.timestamp).toLocaleTimeString(),
                }));
                if (players.length > 0) {
                    // <--- qui filtri
                    console.log(
                        `Queue ${gameType}/${gameSpeed}/${gameLang} (${players.length} players):`
                    );
                    console.table(players);
                }
            }
        }
    }
    console.log("-------------------------------------");
}

module.exports = router;
