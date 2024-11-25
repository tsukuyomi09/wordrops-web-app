const express = require('express');
const router = express.Router();
const checkAuth = require('../middlewares/checkAuthToken');


router.get("/check-session", checkAuth, async (req, res) => {
    res.json({ sessionActive: true, userId: req.user_id, username: req.username });
});

module.exports = router;
