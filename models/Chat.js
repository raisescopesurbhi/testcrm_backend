const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TicketRise",
      required: true,
    },
    senderType: {
      type: String,
      enum: ["User", "Admin", "System"],
      required: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, required: true }, // userId or adminId
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const ChatModel = mongoose.model("Chat", chatSchema);

module.exports = ChatModel;
