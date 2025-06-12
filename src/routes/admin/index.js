const express = require("express");
const router = express.Router();

router.use("/admin-panel", require("../admin/adminPanel"));

module.exports = router;
