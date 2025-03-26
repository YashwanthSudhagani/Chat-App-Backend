const express = require("express");
const router = express.Router();
const crypto = require("crypto"); // To generate a unique invite code
const Invite = require("../models/inviteModels"); // Import the Invite model

// Get the base URL dynamically (for local or production)
const BASE_URL = process.env.NODE_ENV === "production" 
  ? "https://invitelinkfrontend.vercel.app"  // Replace with your production URL
  : "http://localhost:3000"; // Local development URL

// Endpoint to generate an invite link
router.post("/generate-invite", async (req, res) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: "chatId is required" });
    }

    // Generate a unique invite code
    const inviteCode = crypto.randomBytes(16).toString("hex");
    const inviteLink = `${BASE_URL}/invite/${inviteCode}`;

    // Store in MongoDB
    const newInvite = new Invite({ chatId, inviteCode });
    await newInvite.save();  // Save the invite to the database

    // Emit the new invite link to all connected clients
    global.io.emit("new-invite", { chatId, inviteLink });

    return res.status(201).json({ inviteLink });

  } catch (error) {
    console.error("Error generating invite:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Redirect based on invite code
router.get("/:inviteCode", async (req, res) => {
  const { inviteCode } = req.params;

  // Validate the inviteCode (Check in DB if necessary)
  if (!inviteCode) {
    return res.status(400).json({ error: "Invalid invite code" });
  }

  // Check invite code in DB to make sure it's valid
  const invite = await Invite.findOne({ inviteCode });

  if (!invite) {
    return res.status(400).json({ error: "Invalid invite code" });
  }

  // Redirect to the chat page (replace with your front-end URL)
  res.redirect(`${BASE_URL}/chat/${inviteCode}`);
});

// Generate an invite link (alternative method if needed)
router.post("/create", async (req, res) => {
  const { createdBy } = req.body;
  const inviteToken = uuidv4(); // Generate a unique token

  const newInvite = new Invite({ inviteToken, createdBy });
  await newInvite.save();

  res.json({ inviteLink: `${BASE_URL}/invite/${inviteToken}` });
});

// Validate Invite Token (alternative method if needed)
router.get("/:token", async (req, res) => {
  const { token } = req.params;
  const invite = await Invite.findOne({ inviteToken: token });

  if (!invite) return res.status(400).json({ error: "Invalid invite link" });

  res.json({ valid: true });
});

module.exports = router;