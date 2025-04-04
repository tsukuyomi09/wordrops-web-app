const { v4: uuidv4 } = require("uuid");
const { getSocket } = require("./socketManager");
const { saveNormalGame } = require("../services/saveGame");

const activeGames = new Map();
const playersMap = new Map();

async function createGameAndAssignPlayers(game) {
    newGameId = uuidv4();

    try {
        const gameMode = game.mode;

        game.players.forEach((player) => {
            // Aggiungi il gioco per ogni giocatore
            addGameForPlayer(player.id, newGameId, "in_progress", gameMode);
        });

        const turnOrder = shuffleArray(
            game.players.map((player) => ({
                id: player.id,
                username: player.username,
                avatar: player.avatar, // Assicurati che l'avatar sia presente
            }))
        );

        let countdownDuration;
        if (gameMode.includes("fast")) {
            countdownDuration = 50000; // 10 secondi per le modalità "fast"
        } else {
            countdownDuration = 100000; // 20 secondi per le modalità "slow" o altre
        }

        // Aggiungiamo il gioco alla mappa dei giochi attivi sul server
        activeGames.set(newGameId, {
            gameId: newGameId,
            type: null,
            gameMode: gameMode,
            publishStatus: null,
            votes: {},
            players: game,
            chapters: [],
            status: "to-start",
            turnOrder: turnOrder,
            readyPlayersCount: 0,
            turnIndex: 0,
            connections: [],
            countdownDuration: countdownDuration,
            countdownStart: null, // Valore iniziale
            countdownEnd: null,
            countdownInterval: null,
            startedAt: new Date(),
        });

        console.log("Current activeGames map:", activeGames);

        return { gameId: newGameId, turnOrder };
    } catch (err) {
        console.error("Errore nella creazione del gioco:", err);
        throw err;
    }
}

// get players and creare a random turn order
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Scambia gli elementi
    }
    return array;
}

function getActiveGames() {
    return activeGames;
}

function startCountdown(newGameId) {
    const io = getSocket();
    const game = activeGames.get(newGameId);
    if (!game) {
        console.error(`Gioco con ID ${newGameId} non trovato`);
        return;
    }

    const now = Date.now();
    game.countdownStart = now;
    game.countdownEnd = now + game.countdownDuration;

    if (game.countdownInterval) {
        clearInterval(game.countdownInterval);
    }

    game.countdownInterval = setInterval(async () => {
        const remainingTime = game.countdownEnd - Date.now();
        if (remainingTime <= 0) {
            clearInterval(game.countdownInterval);
            game.countdownInterval = null;

            console.log(
                `Tempo scaduto per il turno di ${
                    game.turnOrder[game.turnIndex].username
                }`
            );

            // Esegui la logica di cambio turno anche senza capitolo scritto
            const currentPlayer = game.turnOrder[game.turnIndex];
            const emptyChapter = {
                title: "null",
                content: "null",
                author: currentPlayer.username,
                user_id: currentPlayer.id,
                isValid: false,
            };
            // console.log(`author ${currentPlayer.username}`);
            // console.log(`user_id ${currentPlayer.id}`);
            // console.log(
            //     "currentPlayer:",
            //     JSON.stringify(currentPlayer, null, 2)
            // );

            game.chapters.push(emptyChapter);

            if (game.chapters.length === 5) {
                console.log(`five games reached`);
                console.log(`games chapters = ${game.chapters.length}`);

                try {
                    const saveSuccess = await saveNormalGame(game);
                    if (saveSuccess) {
                        if (
                            ["ranked_slow", "ranked_fast"].includes(
                                game.gameMode
                            )
                        ) {
                            console.log(
                                "Ranked game detected, starting scoring process..."
                            );
                            game.status === "awaiting_scores";
                            io.to(newGameId).emit("awaiting_scores", {
                                chapters: game.chapters,
                                status: game.status,
                                // Altri dati...
                            });

                            setTimeout(() => {
                                io.to(newGameId).disconnectSockets(true);
                                clearInterval(game.countdownInterval);
                                console.log(
                                    "Socket disconnessi dopo invio awaiting-scores."
                                );
                            }, 500);
                        } else {
                            const players = game.players.players;
                            console.log("Players array:", players);

                            players.forEach((player) => {
                                const playerId = player.id;
                                console.log(`Checking player ${playerId}`);

                                const playerData = playersMap.get(playerId);

                                if (playerData) {
                                    console.log(
                                        `Before delete:`,
                                        playerData.games
                                    );
                                    delete playerData.games[newGameId];

                                    console.log(
                                        `After delete:`,
                                        playerData.games
                                    );

                                    if (
                                        Object.keys(playerData.games).length ===
                                        0
                                    ) {
                                        console.log(
                                            `Removing player ${playerId} from playersMap`
                                        );
                                        playersMap.delete(playerId);
                                    }
                                } else {
                                    console.log(
                                        `Player ${playerId} not found in playersMap.`
                                    );
                                }
                            });
                            activeGames.delete(newGameId);
                            io.to(newGameId).emit("gameCompleted");
                            return;
                        }
                    } else {
                        // Se il salvataggio del gioco non ha avuto successo, invia un errore
                        return res.status(500).json({
                            message: "Errore nel salvataggio del gioco.",
                        });
                    }
                } catch (err) {
                    console.error(
                        "Errore durante il processo di salvataggio del gioco:",
                        err
                    );
                    return res.status(500).json({
                        message:
                            "Errore nel processo di completamento del gioco.",
                    });
                }
            }

            game.turnIndex = (game.turnIndex + 1) % game.turnOrder.length;
            const nextPlayer = game.turnOrder[game.turnIndex];

            startCountdown(newGameId);

            io.to(newGameId).emit("nextChapterUpdate", {
                gameId: newGameId,
                chapter: emptyChapter,
                nextPlayer: nextPlayer,
                previousAuthor: currentPlayer.username,
            });
        } else {
            const minutes = Math.floor(remainingTime / 60000);
            const seconds = Math.floor((remainingTime % 60000) / 1000);
            io.in(newGameId).emit("gameUpdate", {
                remainingTime,
                formatted: `${minutes}m ${seconds}s`,
            });
        }
    }, 1000);
}

function addGameForPlayer(playerId, gameId, status = "in_progress", mode) {
    if (!playersMap.has(playerId)) {
        playersMap.set(playerId, {
            games: {},
        });
    }

    const playerData = playersMap.get(playerId);
    playerData.games[gameId] = { status, mode }; // Aggiungi anche la modalità nel gioco
    playersMap.set(playerId, playerData);

    console.log("📌 Stato attuale di playersMap:", playersMap);
}

module.exports = {
    createGameAndAssignPlayers,
    activeGames,
    getActiveGames,
    startCountdown,
    playersMap,
};
