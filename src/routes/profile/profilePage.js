const express = require("express");
const router = express.Router();
const path = require("path");

router.get("/", async (req, res) => {
    const { username: URLusername } = req.params;
    const { isInGame } = req;
    const { gameId } = req;
});

module.exports = router;
