const express = require("express");
const router = express.Router();
const { createGameAndAssignPlayers } = require("../../services/gameManager");
const checkAuth = require("../../middlewares/checkAuthToken");

gameQueues = {
    ranked: { slow: [], fast: [] },
    normal: { slow: [], fast: [] },
};
const playerQueuePosition = {};
let preGameQueue = {};

router.post("/", checkAuth, (req, res) => {
    const user_id = req.user_id;
    const username = req.username;
    const socketId = req.body.socketId;
    const avatar = req.body.avatarForGame;
    const gameType = req.body.gameType;
    const gameSpeed = req.body.gameSpeed;

    if (!user_id) {
        return res.status(401).json({ error: "Utente non autenticato" });
    }

    if (playerQueuePosition[user_id]) {
        return res.status(400).json({ error: "Utente già in coda" });
    }

    gameQueues[gameType][gameSpeed].push({
        user_id: user_id,
        username,
        avatar,
        socketId,
        gameType,
        gameSpeed,
        timestamp: Date.now(),
        pronto: null,
    });

    playerQueuePosition[user_id] = { gameType, gameSpeed };

    const socket = req.io.sockets.sockets.get(socketId);
    if (socket) {
        setTimeout(() => {
            socket.emit("in-queue", "In attesa di altri giocatori");
        }, 1000);
    } else {
        res.status(500).json({
            error: "Errore di connessione. Riprova più tardi.",
        });
    }

    if (gameQueues[gameType][gameSpeed].length >= 5) {
        const players = gameQueues[gameType][gameSpeed].splice(0, 5);
        let gameId = `${gameType}_${gameSpeed}:${Date.now()}`;
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
    }

    return res.status(200).json({ message: "Utente aggiunto alla coda" });
});

router.delete("/", checkAuth, async (req, res) => {
    const user_id = req.user_id;

    const player = playerQueuePosition[user_id];

    if (!player) {
        return res
            .status(400)
            .json({ error: "Utente non trovato in nessuna coda" });
    }

    const { gameType, gameSpeed } = player;
    delete playerQueuePosition[user_id];

    gameQueues[gameType][gameSpeed] = gameQueues[gameType][gameSpeed].filter(
        (player) => player.user_id !== user_id
    );

    req.socket.emit("queueAbandoned", {
        status: "idle",
        message: "Hai abbandonato la coda",
    });
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
