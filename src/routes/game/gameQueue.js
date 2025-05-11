const express = require("express");
const router = express.Router();
const { createGameAndAssignPlayers } = require("../../services/gameManager");
const checkAuth = require("../../middlewares/checkAuthToken");
const checkUserStatus = require("../../middlewares/checkUserStatus");

class Queue {
    constructor() {
        this.items = [];
        this.head = 0;
        this.tail = 0;
    }
    enqueue(item) {
        this.items[this.tail] = item;
        this.tail++;
    }

    removePlayer(user_id) {
        const index = this.items.findIndex(
            (player) => player.user_id === user_id
        );
        if (index === -1) return false;

        this.items.splice(index, 1);
        this.tail--;
        return true;
    }
    dequeueMultiples(n) {
        const players = [];
        for (let i = 0; i < n && this.head < this.tail; i++) {
            players.push(this.items[this.head]);
            this.head++;
        }
        return players;
    }
    checkAndCreateGame() {
        const numPlayers = this.tail - this.head;
        if (numPlayers >= 5) {
            const players = this.dequeueMultiples(5);
            return players;
        }
        return null;
    }
}

const gameQueues = {
    ranked: { slow: new Queue(), fast: new Queue() },
    normal: { slow: new Queue(), fast: new Queue() },
};

const playerQueuePosition = {};
let preGameQueue = {};

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
        pronto: null,
    };

    const queue = gameQueues[gameType][gameSpeed];
    queue.enqueue(player);
    const players = queue.checkAndCreateGame(player);
    playerQueuePosition[user_id] = { gameType, gameSpeed };
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
                const allReady = game.players.every((player) => player.pronto);

                if (allReady) {
                    const { gameId: newGameId, turnOrder } =
                        await createGameAndAssignPlayers(game);
                    const players = game.players;
                    delete preGameQueue[gameId];
                    players.forEach((player) => {
                        delete playerQueuePosition[player.user_id];
                    });

                    io.to(gameId).emit("game-start", {
                        message: "Tutti pronti: inizia il gioco",
                        gameId: newGameId,
                        turnOrder: turnOrder,
                    });
                } else {
                    const players = game.players;
                    delete preGameQueue[gameId];
                    players.forEach((player) => {
                        delete playerQueuePosition[player.user_id];
                    });

                    io.to(gameId).emit(
                        "gamequeue-cancelled",
                        "Non tutti i giocatori erano pronti, partita annullata"
                    );
                }
            }
        } else {
            countdown--;
        }
    }, 1000);
}

module.exports = router;
module.exports.gameQueues = gameQueues;
module.exports.preGameQueue = preGameQueue;
