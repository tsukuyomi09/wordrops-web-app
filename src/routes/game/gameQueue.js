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
    const { socketId, avatarForGame: avatar, gameType, gameSpeed } = req.body;
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
                    ? "Utente non autenticato"
                    : playerQueuePosition[user_id]
                    ? "Utente già in coda"
                    : "Errore di connessione. Riprova più tardi.",
            });
    }

    player = {
        user_id,
        username,
        avatar,
        socketId,
        gameType,
        gameSpeed,
        timestamp: Date.now(),
        pronto: true,
    };

    const queue = gameQueues[gameType][gameSpeed];
    queue.enqueue(player);
    const players = queue.checkAndCreateGame(player);
    playerQueuePosition[user_id] = { gameType, gameSpeed };

    console.log("----- STATO COMPLETO DELLE CODE -----");
    for (const gameType in gameQueues) {
        for (const gameSpeed in gameQueues[gameType]) {
            const queue = gameQueues[gameType][gameSpeed];
            const players = queue.toArray().map((p, index) => ({
                pos: index + 1,
                user_id: p.user_id,
                username: p.username,
                socketId: p.socketId,
                timestamp: new Date(p.timestamp).toLocaleTimeString(),
            }));
            console.log(
                `Coda ${gameType}/${gameSpeed} (${players.length} player):`
            );
            console.table(players);
        }
    }
    console.log("-------------------------------------");
    if (players) {
        const gameId = `${gameType}_${gameSpeed}:${Date.now()}`;
        preGameQueue[gameId] = {
            gameType,
            gameSpeed,
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
        return res.status(200).json({ message: "Utente in pre partita" });
    } else {
        setTimeout(() => {
            socket.emit("in-queue", "In attesa di altri giocatori");
        }, 1000);
        return res.status(200).json({ message: "Utente aggiunto alla coda" });
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
    const queue = gameQueues[player.gameType][player.gameSpeed];
    queue.removePlayer(user_id);

    console.log("----- STATO COMPLETO DELLE CODE -----");
    for (const gameType in gameQueues) {
        for (const gameSpeed in gameQueues[gameType]) {
            const queue = gameQueues[gameType][gameSpeed];
            const players = queue.toArray().map((p, index) => ({
                pos: index + 1,
                user_id: p.user_id,
                username: p.username,
                socketId: p.socketId,
                timestamp: new Date(p.timestamp).toLocaleTimeString(),
            }));
            console.log(
                `Coda ${gameType}/${gameSpeed} (${players.length} player):`
            );
            console.table(players);
        }
    }
    console.log("-------------------------------------");

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
                    message: "Inizia il gioco",
                    gameId: newGameId,
                    turnOrder: turnOrder,
                });
            }
        } else {
            countdown--;
        }
    }, 1000);
}

module.exports = router;
