
const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isGroup: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,  // ✅ this will auto create createdAt & updatedAt
  }
);

module.exports = mongoose.model("Group", groupSchema);
