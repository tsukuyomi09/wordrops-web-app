const { getSocket } = require("./socketManager");
const { saveNormalGame } = require("./saveGame");
const { cancelGameAndSave } = require("./cancelGame");
const { removeGameFromPlayers } = require("../utils/removeGameFromPlayers");
const { activeGames } = require("./gameManager");

function startCountdown(gameId) {
    console.log(`Funzione arrivata in start countdown`);

    const io = getSocket();
    const game = activeGames.get(gameId);
    if (!game) {
        console.error(`Gioco con ID ${gameId} non trovato`);
        return;
    }

    const now = Date.now();
    game.countdownStart = now;
    game.countdownEnd = now + game.countdownDuration;
    console.log(`Tempo di inizio countdown: ${now}`);
    console.log(`Tempo di fine countdown: ${game.countdownEnd}`);

    if (game.countdownInterval) {
        clearInterval(game.countdownInterval);
    }

    game.countdownInterval = setInterval(async () => {
        const remainingTime = game.countdownEnd - Date.now();
        console.log(`Tempo rimanente: ${remainingTime} ms`);
        if (remainingTime <= 0) {
            await handleCountdownExpiration(io, game, gameId, startCountdown);
        } else {
            const minutes = Math.floor(remainingTime / 60000);
            const seconds = Math.floor((remainingTime % 60000) / 1000);
            io.in(gameId).emit("gameUpdate", {
                remainingTime,
                formatted: `${minutes}m ${seconds}s`,
            });
        }
    }, 1000);
}

async function handleCountdownExpiration(io, game, gameId, startCountdown) {
    clearInterval(game.countdownInterval);
    game.countdownInterval = null;

    const currentPlayer = game.turnOrder[game.turnIndex];
    console.log(`Tempo scaduto per il turno di ${currentPlayer.username}`);

    const emptyChapter = {
        title: "null",
        content: "null",
        author: currentPlayer.username,
        user_id: currentPlayer.id,
        isValid: false,
    };

    game.chapters.push(emptyChapter);

    const nullChapters = game.chapters.filter(
        (ch) => ch.content === "null" || ch.content === null
    );
    console.log(`Capitoli vuoti o nulli:`, nullChapters.length);
    console.log(`nullChapters: ${nullChapters}`);

    if (nullChapters.length >= 2) {
        await cancelGameAndSave(gameId);
        return { canceled: true };
    }

    if (game.chapters.length === 5) {
        await checkAndCompleteGame(io, game, gameId);
    }

    game.turnIndex = (game.turnIndex + 1) % game.turnOrder.length;
    const nextPlayer = game.turnOrder[game.turnIndex];

    startCountdown(gameId);

    io.to(gameId).emit("nextChapterUpdate", {
        gameId,
        chapter: emptyChapter,
        nextPlayer,
        previousAuthor: currentPlayer.username,
    });
}

async function checkAndCompleteGame(io, game, gameId) {
    if (game.chapters.length !== 5) return;

    console.log(`Five games reached`);
    console.log(`Games chapters = ${game.chapters.length}`);

    try {
        const saveSuccess = await saveNormalGame(game);
        if (!saveSuccess) {
            return res.status(500).json({
                message: "Errore nel salvataggio del gioco.",
            });
        }

        if (["ranked_slow", "ranked_fast"].includes(game.gameMode)) {
            await handleRankedGameCompletion(io, game, gameId);
        } else {
            await handleCasualGameCompletion(io, game, gameId);
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

async function handleRankedGameCompletion(io, game, gameId) {
    console.log("Ranked game detected, starting scoring process...");
    game.status = "awaiting_scores";

    io.to(gameId).emit("awaiting_scores", {
        chapters: game.chapters,
        status: game.status,
    });

    setTimeout(() => {
        io.to(gameId).disconnectSockets(true);
        clearInterval(game.countdownInterval);
        console.log("Socket disconnessi dopo invio awaiting-scores.");
    }, 500);
}

async function handleCasualGameCompletion(io, game) {
    await removeGameFromPlayers(game);

    activeGames.delete(gameId);
    io.to(gameId).emit("gameCompleted");
}

module.exports = { startCountdown };
