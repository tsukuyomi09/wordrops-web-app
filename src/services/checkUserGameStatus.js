const { playersMap } = require("./gameManager");

const checkUserGameStatus = (req, res, next) => {
    const user_id = req.user_id;
    if (playersMap.has(user_id)) {
        const games = playersMap.get(user_id).games;
        const gameId = req.params.gameId;
        if (games[gameId]) {
            req.isInGame = true;
            req.gameId = gameId;
        } else {
            req.isInGame = false;
        }
    } else {
        req.isInGame = false;
    }

    next();
};

module.exports = checkUserGameStatus;
