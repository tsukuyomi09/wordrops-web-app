const express = require('express');
const router = express.Router();
const path = require('path');
const checkUserStatus = require('../middlewares/checkUserStatus');

router.get("/dashboard", checkUserStatus, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"))
})

module.exports = router;