const express = require('express');
const router = express.Router();
const checkSession = require('../middlewares/checkSession');


router.get("/check-session", checkSession, async (req, res) => {
    res.json({ sessionActive: true, userId: req.user_id });
});

module.exports = router;
