const express = require("express");
const router = express.Router();
const { createGameAndAssignPlayers } = require("../services/gameManager");
const { activeGames } = require("../services/gameManager");
const checkAuth = require("../middlewares/checkAuthToken");

gameQueues = {
    normal_slow: [],
    normal_fast: [],
    ranked_slow: [],
    ranked_fast: [],
};
let preGameQueue = {};

// add player to queue
router.post("/gamequeueNew", checkAuth, (req, res) => {
    const userId = req.user_id;
    const username = req.username;
    const socketId = req.body.socketId;
    const avatar = req.body.avatarForGame;
    const mode = req.body.mode;
    console.log(`players in queue on mode: ${mode}`);

    if (!userId) {
        return res.status(401).json({ error: "Utente non autenticato" });
    }

    if (!mode || !gameQueues[mode]) {
        return res.status(400).json({ error: "Modalità non valida" });
    }

    if (
        Object.values(gameQueues).some((queue) =>
            queue.some((player) => player.id === userId)
        )
    ) {
        return res.status(400).json({ error: "Utente già in coda" });
    }

    gameQueues[mode].push({
        id: userId,
        username,
        avatar, // Includi l'avatar
        socketId,
        mode,
        timestamp: Date.now(),
        pronto: null,
    });

    const socket = req.io.sockets.sockets.get(socketId);
    if (socket) {
        setTimeout(() => {
            socket.emit("in-queue", "In attesa di altri giocatori");
        }, 1000);
    } else {
        console.log(
            `Nessun socket trovato per ${username} con socketId ${socketId}`
        );
    }

    // Controlla se ci sono 5 giocatori nella coda
    if (gameQueues[mode].length >= 5) {
        const players = gameQueues[mode].splice(0, 5); // Rimuovi i primi 5 giocatori dalla coda
        let gameId = `game_${mode}:${Date.now()}`;
        preGameQueue[gameId] = {
            mode, // Salviamo la modalità
            players, // I giocatori con la modalità già inclusa
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

// remove player from queue
router.delete("/gamequeueNew", checkAuth, async (req, res) => {
    const userId = req.user_id; // Ottieni l'ID dell'utente dalla sessione
    let modeFound = null;

    // Trova in quale coda si trova l'utente
    for (const mode in gameQueues) {
        const playerIndex = gameQueues[mode].findIndex(
            (player) => player.id === userId
        );
        if (playerIndex !== -1) {
            modeFound = mode;
            gameQueues[mode].splice(playerIndex, 1);
            break;
        }
    }

    if (!modeFound) {
        return res
            .status(400)
            .json({ error: "Utente non trovato in nessuna coda" });
    }

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
        io.to(gameId).emit("countdown", countdown); // Invia il countdown corrente

        if (countdown <= 0) {
            // Quando il countdown termina
            clearInterval(preGameCountdownInterval); // Ferma il countdown
            const game = preGameQueue[gameId]; // Recupera il gioco

            if (game) {
                const allReady = game.players.every((player) => player.pronto);

                if (allReady) {
                    const { gameId: newGameId, turnOrder } =
                        await createGameAndAssignPlayers(game);

                    io.to(gameId).emit("game-start", {
                        message: "Tutti pronti: inizia il gioco",
                        gameId: newGameId, // Passiamo il gameId al client
                        turnOrder: turnOrder,
                    });
                } else {
                    io.to(gameId).emit(
                        "game-cancelled",
                        "Non tutti i giocatori erano pronti, partita annullata"
                    ); // Rimuovi la coda del gioco dal server
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
