const express = require("express");
const { addMessage, getMessages,addCallMessage,getCallMessages } = require("../controllers/messagescontroller");
const router = express.Router();
 
// Route to add a new message (including emojis)
router.post("/addmsg", addMessage);
 
// Route to fetch messages between two users
router.post("/getmsg", getMessages);
 
router.post("/add-call", addCallMessage);
router.post("/get-calls", getCallMessages);
 
 
module.exports = router;
 