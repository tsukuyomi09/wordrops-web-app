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

        const turnOrder = game.players
            .map((player) => ({
                user_id: player.user_id,
                username: player.username,
                avatar: player.avatar,
            }))
            .sort(() => Math.random() - 0.5);

        let countdownDuration = 3600000;
        if (gameSpeed === "fast") {
            countdownDuration = 86400000;
        }

        activeGames.set(newGameId, {
            gameId: newGameId,
            gameType: gameType,
            gameSpeed: gameSpeed,
            publishStatus: null,
            votes: {},
            players: players,
            chapters: [],
            chapterReadMap: new Map(),
            status: "to-start",
            turnOrder: turnOrder,
            readyPlayersCount: new Set(),
            chat: [],
            turnIndex: 0,
            connections: [],
            countdownDuration: countdownDuration,
            countdownStart: null,
            countdownEnd: null,
            countdownInterval: null,
            startedAt: new Date(),
        });

        return { gameId: newGameId, turnOrder };
    } catch (err) {
        throw err;
    }
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
