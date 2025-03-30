const { playersMap } = require("../services/gameManager");

const checkUserGameStatus = (req, res, next) => {
    const user_id = req.user_id;

    console.log(`Checking if user ${user_id} is in a game...`);

    console.log("Current playersMap:", playersMap);

    if (playersMap.has(user_id)) {
        const games = playersMap.get(user_id).games;
        console.log(
            `User ${user_id} is in the playersMap. Checking their games...`
        );

        const gameId = req.params.gameId;
        if (games[gameId]) {
            console.log(`User ${user_id} is in game ${gameId}`);
            req.isInGame = true;
            req.gameId = gameId;
        } else {
            console.log(`User ${user_id} is not in game ${gameId}`);
            req.isInGame = false;
        }
    } else {
        req.isInGame = false;
    }

    next();
};

module.exports = checkUserGameStatus;
