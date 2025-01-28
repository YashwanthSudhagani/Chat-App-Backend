const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  message: String,
  isChatRequest: {type:Boolean,default:false}
});

module.exports = mongoose.model("Messages", messageSchema);
