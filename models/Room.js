const mongoose = require("mongoose")

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  hostId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["one-on-one", "group-call"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Room", roomSchema)
