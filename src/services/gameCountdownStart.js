const { getSocket } = require("./socketManager");
const { saveGame } = require("./saveGame");
const { cancelGameAndSave } = require("./cancelGame");
const { handleGameCompletion } = require("../utils/handleGameCompletion");

const { activeGames } = require("./gameManager");

function startCountdown(gameId) {
    const io = getSocket();
    const game = activeGames.get(gameId);
    if (!game) {
        console.error(`Gioco con ID ${gameId} non trovato`);
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
            await handleCountdownExpiration(io, game, gameId, startCountdown);
        } else {
            const formatted = formatMillisecondsToTime(remainingTime);
            io.in(gameId).emit("gameUpdate", {
                remainingTime,
                formatted,
            });
        }
    }, 1000);
}

function formatMillisecondsToTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

async function handleCountdownExpiration(io, game, gameId, startCountdown) {
    clearInterval(game.countdownInterval);
    game.countdownInterval = null;

    const currentPlayer = game.turnOrder[game.turnIndex];

    const emptyChapter = {
        title: "null",
        content: "null",
        author: currentPlayer.username,
        user_id: currentPlayer.user_id,
        isValid: false,
        timestamp: Date.now(),
    };

    game.chapters.push(emptyChapter);

    const nullChapters = game.chapters.filter(
        (ch) => ch.content === "null" || ch.content === null
    );

    if (nullChapters.length >= 2) {
        await new Promise((resolve, reject) => {
            try {
                io.to(gameId).emit("gameCanceled", {
                    reason: "La partita è stata annullata: troppi capitoli nulli.",
                    gameId,
                });
                resolve();
            } catch (error) {
                reject(error);
            }
        });

        handleGameCompletion(game, gameId, io);
        await cancelGameAndSave(game);
        io.to(gameId).disconnectSockets(true);
        return { canceled: true };
    }

    if (game.chapters.length === 5) {
        await checkAndCompleteGame(io, game, gameId);
    }

    game.turnIndex = (game.turnIndex + 1) % game.turnOrder.length;
    const nextPlayer = game.turnOrder[game.turnIndex];

    startCountdown(gameId);

    io.in(gameId).emit("newChapterNotification", {
        timestamp: emptyChapter.timestamp,
        gameId,
    });

    io.to(gameId).emit("nextChapterUpdate", {
        gameId,
        chapter: emptyChapter,
        nextPlayer,
        previousAuthor: currentPlayer.username,
    });
}

async function checkAndCompleteGame(io, game, gameId) {
    try {
        handleGameCompletion(game, gameId, io);
        const saveSuccess = await saveGame(game);
        if (!saveSuccess) {
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
            message: "Errore nel processo di completamento del gioco.",
        });
    }
}

module.exports = { startCountdown };
