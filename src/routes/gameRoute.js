const express = require('express');
const router = express.Router();
const path = require('path');
const checkAuth = require('../middlewares/checkAuthToken');
const checkUserStatus = require('../middlewares/checkUserStatus');

router.get('/game/:gameId', checkAuth, checkUserStatus, async (req, res) => {

    res.sendFile(path.join(__dirname, '..', '..', 'views', 'game.html'));

});

module.exports = router;