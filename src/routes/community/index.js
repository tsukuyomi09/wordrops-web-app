const express = require("express");
const router = express.Router();

router.use("/load-more-books", require("./communityMoreBooks"));

module.exports = router;
