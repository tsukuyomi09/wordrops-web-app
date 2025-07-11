// Middleware to check the user's game status
// It uses the playersMap to determine if a user is currently in any game
// If the user is in the map, it retrieves their associated games and sets the game_id
// If the user is not in any game, game_id will be set to null

const { playersMap } = require("../services/gameManager");

const checkUserStatus = async (req, res, next) => {
    try {
        const userId = req.user_id;

        if (playersMap.has(userId)) {
            const userGames = playersMap.get(userId).games;
            req.userGames = userGames;
            req.userStatus = "in_game";
            req.maxGamesReached = Object.keys(userGames).length >= 5;
        } else {
            req.userGames = null;
            req.userStatus = "not_in_game";
            req.maxGamesReached = false;
        }

        next();
    } catch (error) {
        console.error("Error checking user status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = checkUserStatus;
