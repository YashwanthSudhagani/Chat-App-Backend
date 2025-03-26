const mongoose = require("mongoose");

const InviteSchema = new mongoose.Schema({
  chatId: { type: String, required: true },  // Required chat ID
  inviteCode: { type: String, required: true, unique: true }, // Unique invite code
  createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-delete after 24 hours
});

const Invite = mongoose.model("Invite", InviteSchema);
module.exports = Invite;  // Fix incorrect export