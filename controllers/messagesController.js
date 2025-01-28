const Message = require("../models/messagesModel");

module.exports.addMessage = (req, res) => {
  const { from, to, message, isChatRequest } = req.body;

  if (!to) {
    return res.status(400).json({ success: false, message: "Recipient 'to' is required." });
  }

  const newMessage = new Message({
    from,
    to,
    message,
    isChatRequest,
    status: 'pending',
  });

  newMessage.save()
    .then(() => {
      const io = req.app.get("io");

      io.to(to).emit("msg-recieve", { msg: message, from, isChatRequest });

      res.json({ success: true, message: "Message saved successfully!" });
    })
    .catch((err) => {
      console.error("Error saving message:", err);
      res.status(500).json({ success: false, message: "Failed to send message" });
    });
};

module.exports.handleChatRequest = async (req, res) => {
  const { from, to, response } = req.body;

  if (!from || !to || !response) {
    return res.status(400).json({ message: "From, To, and Response are required." });
  }

  try {
    // Fetch the chat request message (i.e., a message where isChatRequest is true)
    const chatRequest = await Message.findOne({
      from,
      to,
      isChatRequest: true,
    });

    if (!chatRequest) {
      return res.status(404).json({ message: "Chat request not found." });
    }

    // Handle response to the chat request (accept/decline)
    chatRequest.isChatRequest = false;  // Mark it as no longer a request
    chatRequest.response = response;  // Store the response (accept/decline)

    await chatRequest.save();

    // Optionally, handle what happens after acceptance or decline
    res.status(200).json(chatRequest);
  } catch (error) {
    res.status(500).json({ message: "Failed to handle chat request.", error: error.message });
  }
};

module.exports.getMessages = async (req, res) => {
  const { from, to } = req.body;

  if (!from || !to) {
    return res.status(400).json({ message: "User IDs are required." });
  }

  try {
    // Retrieve all messages between users, including pending ones
    const messages = await Message.find({
      from: { $in: [from, to] },
      to: { $in: [from, to] },
    }).populate("from", "username");

    if (!messages) {
      return res.status(404).json({ message: "No messages found." });
    }

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages.", error: error.message });
  }
};
