const Invite = require("../models/inviteModels");
const { v4: uuidv4 } = require("uuid");

// Controller for generating an invite link
const generateInvite = async (req, res) => {
  const { chatId } = req.body;

  // Validate if chatId is provided
  if (!chatId) return res.status(400).json({ error: "Chat ID is required" });

  try {
    // Generate a unique invite code
    const inviteCode = uuidv4();
    const newInvite = new Invite({ chatId, inviteCode });

    // Save the invite to the database
    await newInvite.save();

    // Respond with the invite link
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";  // Default to local URL if env var not set
    res.json({ inviteLink: `${frontendUrl}/invite/${inviteCode}` });
  } catch (error) {
    console.error("Error generating invite:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller for validating an invite code
const validateInvite = async (req, res) => {
  const { code } = req.params;

  try {
    // Find the invite in the database
    const invite = await Invite.findOne({ inviteCode: code });

    // If invite not found, return an error
    if (!invite) return res.status(404).json({ error: "Invalid or expired invite" });

    // Return a valid response
    res.json({ message: "Valid invite", chatId: invite.chatId });
  } catch (error) {
    console.error("Error validating invite:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { generateInvite, validateInvite };