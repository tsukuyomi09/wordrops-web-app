const { v4: uuidv4 } = require("uuid");
const { getSocket } = require("./socketManager");

const activeGames = new Map();
const playersMap = new Map();

async function createGameAndAssignPlayers(game) {
    newGameId = Date.now();

    try {
        const playerIds = game.map((player) => player.id);
        newGameId = uuidv4();

        game.forEach((player) => {
            // Aggiungi il gioco per ogni giocatore
            addGameForPlayer(player.id, newGameId);
        });

        const turnOrder = shuffleArray(
            game.map((player) => ({
                id: player.id,
                username: player.username,
                avatar: player.avatar, // Assicurati che l'avatar sia presente
            }))
        );

        // Aggiungiamo il gioco alla mappa dei giochi attivi sul server
        activeGames.set(newGameId, {
            gameId: newGameId,
            type: null,
            votes: {},
            players: game,
            chapters: [],
            status: "to-start",
            turnOrder: turnOrder,
            readyPlayersCount: 0,
            turnIndex: 0,
            connections: [],
            countdownDuration: 1800000, // 30 minutes
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

    // Se esiste già un intervallo, lo cancella
    if (game.countdownInterval) {
        clearInterval(game.countdownInterval);
    }

    // Avvia un nuovo intervallo
    game.countdownInterval = setInterval(() => {
        const remainingTime = game.countdownEnd - Date.now();
        if (remainingTime <= 0) {
            game.status = "ready-to-start";
            clearInterval(game.countdownInterval);
            game.countdownInterval = null;
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

function addGameForPlayer(playerId, gameId, status = "in_progress") {
    // Se il giocatore non esiste, crea una nuova entry
    if (!playersMap.has(playerId)) {
        playersMap.set(playerId, {
            games: {},
        });
    }

    // Ottieni i dati del giocatore
    const playerData = playersMap.get(playerId);
    // Aggiungi il gioco alla mappa del giocatore con lo stato
    playerData.games[gameId] = status;

    // Riaffetta i dati aggiornati alla mappa
    playersMap.set(playerId, playerData);
}

module.exports = {
    createGameAndAssignPlayers,
    activeGames,
    getActiveGames,
    startCountdown,
    playersMap,
};
