const Messages = require("../models/messagesModel");
 
 
const callUser = (req, res) => {
  const { from, to, type } = req.body;
 
  req.io.to(to).emit("incoming-call", { from, type });
  res.status(200).json({ success: true, message: "Call initiated" });
};
 
module.exports.getMessages = async (req, res) => {
  try {
    const { from, to } = req.body;
 
    // Fetch all messages between 'from' and 'to', sorted by the timestamp
    const messages = await Messages.find({
      users: { $all: [from, to] }, // Ensures messages are between both users
    }).sort({ updatedAt: 1 });
 
    // Format the messages for the frontend (determine if the message is from the sender or not)
    const formattedMessages = messages.map((msg) => ({
      fromSelf: msg.sender.toString() === from, // Check if the message is from the current user
      message: msg.message.text, // The actual message text (including emojis)
    }));
 
    res.json(formattedMessages); // Return the formatted messages to the client
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};
 
module.exports.addMessage = async (req, res) => {
  try {
    const { from, to, message } = req.body;
 
    // Log the incoming message to ensure it's being received correctly
    console.log("Received message:", message); // Ensure emojis are included here
 
    // Validate the message
    if (!message || message.trim() === "") {
      return res.status(400).json({ msg: "Message cannot be empty" });
    }
 
    // Save the message in the database
    const data = await Messages.create({
      message: { text: message }, // Store the message text (including emojis)
      users: [from, to], // The two users involved in the conversation
      sender: from, // The sender of the message
    });
 
    // Log the result to verify it's stored correctly
    console.log("Message stored:", data);
 
    if (data) {
      return res.json({ msg: "Message added successfully." });
    } else {
      return res.status(500).json({ msg: "Failed to add message to the database" });
    }
  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};
 
// Store a call log message
module.exports.addCallMessage = async (req, res) => {
  try {
    const { from, to, type, status } = req.body;
 
    const callMessage = await Messages.create({
      message: { text: `Call ${status}: ${type}` },
      users: [from, to],
      sender: from,
      type: "call",
    });
 
    res.status(200).json({ success: true, message: callMessage });
  } catch (error) {
    console.error("Error saving call message:", error);
    res.status(500).json({ success: false, msg: "Internal Server Error" });
  }
};
 
// Retrieve call logs between two users
module.exports.getCallMessages = async (req, res) => {
  try {
    const { from, to } = req.body;
    const callLogs = await Messages.find({
      users: { $all: [from, to] },
      type: "call",
    }).sort({ createdAt: 1 });
 
    res.status(200).json(callLogs);
  } catch (error) {
    console.error("Error fetching call logs:", error);
    res.status(500).json({ success: false, msg: "Internal Server Error" });
  }
};
// Save call details
exports.addCall = async (req, res) => {
  try {
    const { from, to, callType, callStatus } = req.body;
 
    const call = new Call({ from, to, callType, callStatus });
    await call.save();
 
    res.status(201).json({ message: "Call details saved", call });
  } catch (error) {
    res.status(500).json({ error: "Error saving call details" });
  }
};
 
// Fetch call logs
exports.getCall = async (req, res) => {
  try {
    const { from, to } = req.body;
 
    const calls = await Call.find({
      $or: [
        { from, to },
        { from: to, to: from },
      ],
    }).sort({ timestamp: -1 });
 
    res.json(calls);
  } catch (error) {
    res.status(500).json({ error: "Error fetching call logs" });
  }
};