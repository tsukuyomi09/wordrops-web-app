const { v4: uuidv4 } = require("uuid");
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
            countdownDuration = 150000000; // 10 secondi per le modalità "fast"
        } else {
            countdownDuration = 300000000; // 20 secondi per le modalità "slow" o altre
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
            chapterReadMap: new Map(),
            status: "to-start",
            turnOrder: turnOrder,
            readyPlayersCount: 0,
            chat: [],
            turnIndex: 0,
            connections: [],
            countdownDuration: countdownDuration,
            countdownStart: null,
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

function getActiveGames() {
    return activeGames;
}

/// delete game /////

module.exports = {
    createGameAndAssignPlayers,
    activeGames,
    getActiveGames,
    playersMap,
};
