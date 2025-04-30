const express = require("express");
const router = express.Router();

router.use("/search-user", require("./searchUser"));

module.exports = router;
