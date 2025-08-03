const { v4: uuidv4 } = require("uuid");
const { saveActivePlayersDB } = require("../activeGameDB/saveActivePlayersDB");

const activeGames = new Map();
const activePlayersMap = new Map();

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

        const playersData = players.map((player) => ({
            user_id: player.user_id,
            game_id: newGameId,
            status: "in_progress",
            game_type: gameType,
            game_speed: gameSpeed,
            game_lang: game_lang,
        }));

        await saveActivePlayersDB(playersData);

        const turnOrder = game.players
            .map((player) => ({
                user_id: player.user_id,
                username: player.username,
                avatar: player.avatar,
            }))
            .sort(() => Math.random() - 0.5);

        let countdownDuration = 30 * 1000; // 1 hour
        // if (gameSpeed === "slow") {
        //     countdownDuration = 12 * 60 * 60 * 1000; // 12 hours
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
        for (const [user_id, data] of activePlayersMap.entries()) {
            console.log(`Player ${user_id} (type: ${typeof user_id})`);
            for (const [game_id, gameData] of Object.entries(data.games)) {
                console.log(
                    `  → Game ID: ${game_id} (type: ${typeof game_id}) - status: ${
                        gameData.status
                    }, lang: ${gameData.game_lang}`
                );
            }
        }

        // console.log("------ ACTIVE GAMES ------");
        // for (const [gameId, gameData] of activeGames.entries()) {
        //     console.log(`Game ${gameId}:`);
        //     console.dir(gameData, { depth: null });
        // }
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
    if (!activePlayersMap.has(user_id)) {
        activePlayersMap.set(user_id, {
            games: {},
        });
    }

    const playerData = activePlayersMap.get(user_id);
    playerData.games[gameId] = { status, gameType, gameSpeed, game_lang };
    activePlayersMap.set(user_id, playerData);
}

module.exports = {
    createGameAndAssignPlayers,
    activeGames,
    activePlayersMap,
};
