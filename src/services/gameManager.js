const { v4: uuidv4 } = require("uuid");
const activeGames = new Map();
const playersMap = new Map();

async function createGameAndAssignPlayers(game) {
    newGameId = uuidv4();

    try {
        const { gameType, gameSpeed, players } = game;

        players.forEach((player) => {
            addGameForPlayer(
                player.user_id,
                newGameId,
                "in_progress",
                gameType,
                gameSpeed
            );
        });

        const turnOrder = shuffleArray(
            game.players.map((player) => ({
                user_id: player.user_id,
                username: player.username,
                avatar: player.avatar, // Assicurati che l'avatar sia presente
            }))
        );

        let countdownDuration = 300000000; // slow game
        if (gameMode === "fast") {
            countdownDuration = 150000000; // fast game
        }

        // Aggiungiamo il gioco alla mappa dei giochi attivi sul server
        activeGames.set(newGameId, {
            gameId: newGameId,
            gameType: gameType,
            gameSpeed: gameSpeed,
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

function addGameForPlayer(
    user_id,
    gameId,
    status = "in_progress",
    gameType,
    gameSpeed
) {
    if (!playersMap.has(user_id)) {
        playersMap.set(user_id, {
            games: {},
        });
    }

    const playerData = playersMap.get(user_id);
    playerData.games[gameId] = { status, gameType, gameSpeed };
    playersMap.set(user_id, playerData);
    console.log("📌 Stato attuale di playersMap:", playersMap);
}

function getActiveGames() {
    return activeGames;
}

module.exports = {
    createGameAndAssignPlayers,
    activeGames,
    getActiveGames,
    playersMap,
};
