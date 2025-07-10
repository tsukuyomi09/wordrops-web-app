const { v4: uuidv4 } = require("uuid");
const activeGames = new Map();
const playersMap = new Map();

async function createGameAndAssignPlayers(game) {
    newGameId = uuidv4();

    try {
        const { gameType, gameSpeed, game_lang, players } = game;

        players.forEach((player) => {
            addGameForPlayer(
                player.user_id,
                newGameId,
                "in_progress",
                gameType,
                gameSpeed,
                game_lang
            );
        });

        const turnOrder = game.players
            .map((player) => ({
                user_id: player.user_id,
                username: player.username,
                avatar: player.avatar,
            }))
            .sort(() => Math.random() - 0.5);

        let countdownDuration = 30000000;
        // if (gameSpeed === "fast") {
        //     countdownDuration = 3600000;
        // }

        activeGames.set(newGameId, {
            gameId: newGameId,
            gameType: gameType,
            gameSpeed: gameSpeed,
            game_lang: game_lang,
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

        console.log("------ PLAYERS MAP ------");
        for (const [user_id, data] of playersMap.entries()) {
            console.log(`Player ${user_id}:`, JSON.stringify(data, null, 2));
        }
        console.log("------ ACTIVE GAMES ------");
        for (const [gameId, gameData] of activeGames.entries()) {
            console.log(`Game ${gameId}:`);
            console.dir(gameData, { depth: null });
        }
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
    gameSpeed,
    game_lang
) {
    if (!playersMap.has(user_id)) {
        playersMap.set(user_id, {
            games: {},
        });
    }

    const playerData = playersMap.get(user_id);
    playerData.games[gameId] = { status, gameType, gameSpeed, game_lang };
    playersMap.set(user_id, playerData);
}

module.exports = {
    createGameAndAssignPlayers,
    activeGames,
    playersMap,
};
