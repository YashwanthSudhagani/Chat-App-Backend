const express = require("express");
const { createPoll, getPolls } = require("../controllers/pollController");
const router = express.Router();

router.post("/Sendpoll", createPoll);
router.get("/Getpoll", getPolls);

module.exports = router;
