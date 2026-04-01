const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // TTL: expires 300 seconds (5 min) after creation
  },
});

// Index for TTL (optional, for clarity)
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });
const otpModel = mongoose.model("Otp", otpSchema);
module.exports = otpModel