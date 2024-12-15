const express = require('express');
const router = express.Router();
const path = require('path');
const checkAuth = require('../middlewares/checkAuthToken');
const checkUserGameStatus = require('../routes/checkUserGameStatus');

router.get('/game/:gameId', checkAuth, checkUserGameStatus, async (req, res) => {

    res.sendFile(path.join(__dirname, '..', '..', 'views', 'game.html'));

});

module.exports = router;