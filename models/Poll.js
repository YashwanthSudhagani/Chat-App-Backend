const mongoose = require("mongoose");

const PollSchema = new mongoose.Schema({
  question: String,
  options: [
    {
      id: String,
      text: String,
      votes: Number,
      voters: [String], // Stores user IDs
    },
  ],
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Poll", PollSchema);
