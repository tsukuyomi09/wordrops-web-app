const express = require("express");
const router = express.Router();
const { activeGames } = require("../../services/gameManager");
const { startCountdown } = require("../../services/gameCountdownStart");
const { saveGame } = require("../../services/saveGame");
const { handleGameCompletion } = require("../../utils/handleGameCompletion");
const checkAuth = require("../../middlewares/checkAuthToken");

router.post("/:gameId", checkAuth, async (req, res) => {
    const user_id = req.user_id;
    const username = req.username;
    const { gameId } = req.params;
    const { title, content, currentUser } = req.body;

    if (username !== currentUser) {
        res.status(403).json({ message: "User not authorized." });
        return;
    }

    const game = activeGames.get(gameId);
    if (!game) {
        res.status(404).json({ message: "Game not found." });
        return;
    }

    const turnIndex = game.turnIndex;
    const currentTurnPlayer = game.turnOrder[turnIndex];

    if (!currentTurnPlayer) {
        res.status(500).json({
            message: "Error retrieving current turn.",
        });
        return;
    }

    if (currentTurnPlayer.username !== currentUser) {
        res.status(403).json({
            message: "It is not this player's turn.",
        });
        return;
    }

    const newChapter = {
        title,
        content,
        author: username,
        user_id: user_id,
        isValid: true,
        timestamp: Date.now(),
    };

    game.chapters.push(newChapter);

    if (game.chapters.length === 5) {
        try {
            handleGameCompletion(game, gameId, req.io);
            const saveSuccess = await saveGame(game);
            req.io.to(gameId).disconnectSockets(true);
            if (!saveSuccess) {
                return res
                    .status(500)
                    .json({ message: "Error saving the game." });
            }

            return res.json({
                message: "Game completed and players notified.",
            });
        } catch (err) {
            return res.status(500).json({
                message: "An error occurred while handling the game.",
            });
        }
    }

    req.io.in(gameId).emit("newChapterNotification", {
        timestamp: newChapter.timestamp,
        gameId,
    });

    game.turnIndex = (turnIndex + 1) % game.turnOrder.length;

    startCountdown(gameId, false);

    req.io.to(gameId).emit("nextChapterUpdate", {
        gameId: gameId,
        chapter: newChapter,
        nextPlayer: game.turnOrder[game.turnIndex],
        previousAuthor: username,
    });

    res.json({ message: "Data received successfully." });
});

module.exports = router;
