// messageRoutes.js
const express = require("express");
const router = express.Router();
const { addMessage,getMessages,handleChatRequest} = require("../controllers/messagesController");


router.post("/addmsg", addMessage);
router.get("/get",getMessages)
router.post("/handleRequest",handleChatRequest)

module.exports = router;
