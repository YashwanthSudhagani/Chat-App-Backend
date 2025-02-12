const express = require("express");
// const Message = require("../models/messagesModel"); 
const mongoose = require("mongoose"); // ✅ Correct import

const { addMessage, getMessages,addCallMessage,getCallMessages,deleteMessage,updateMessage } = require("../controllers/messagesController");
const router = express.Router();
 
// Route to add a new message (including emojis)
router.post("/addmsg", addMessage);
 
// Route to fetch messages between two 
router.post("/getmsg", getMessages);
router.put("/:messageId",updateMessage);
router.delete("/:messageId", deleteMessage);
 
router.post("/add-call", addCallMessage);
router.post("/get-calls", getCallMessages);

// router.put("/:messageId", async (req, res) => {
//     try {
//       let messageId = req.params.messageId.trim(); // ✅ Trim to remove spaces/newlines
//       const { text } = req.body;
  
//       // ✅ Ensure messageId is a valid MongoDB ObjectId
//       if (!mongoose.Types.ObjectId.isValid(messageId)) {
//         return res.status(400).json({ error: "Invalid message ID format" });
//       }
  
//       console.log("Updating message:", messageId, "with text:", text); // Debugging log
  
//       const updatedMessage = await Message.findByIdAndUpdate(
//         messageId,
//         { "message.text": text },
//         { new: true, runValidators: true }
//       );
  
//       if (!updatedMessage) {
//         return res.status(404).json({ error: "Message not found" });
//       }
  
//       res.json(updatedMessage);
//     } catch (err) {
//       console.error("Error updating message:", err); // Log the error
//       res.status(500).json({ error: "Failed to update message", details: err.message });
//     }
//   });
  
  
 
module.exports = router;
 