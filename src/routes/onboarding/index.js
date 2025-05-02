const express = require("express");
const router = express.Router();

router.use("/finish-onboarding", require("./finishOnboarding"));
router.use("/check-username", require("./createProfileCheckUsername"));
router.use("/waiting-list", require("./waitingList"));

module.exports = router;
