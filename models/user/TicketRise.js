const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "adminUser" },

    status: {
      type: String,
      enum: ["open", "in-progress", "closed", "resolved"],
      default: "open",
    },

    // 🔑 Add this field for user feedback
    userFeedback: {
      type: String,
      enum: ["pending", "resolved", "not-resolved"],
      default: "pending",
    },
    feedbackAt: {
      type: Date,
    },

    createdBy: { type: String, required: true },
    description: { type: String, required: true },

    priority: {
      type: String,
      enum: ["Low", "High", "Medium", "Critical"],
      default: "Low",
    },

    autoReply : {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const ticketRiseModal = mongoose.model("TicketRise", ticketSchema);

module.exports = ticketRiseModal;
