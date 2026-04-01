const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    browser: {
      type: String,
      required: true,
    },
    os: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      required: true, // Ensures IP is always present
    },
  },
  {
    timestamps: true,
  }
);

const UserLogModel = mongoose.model("UserLog", logSchema);
module.exports = UserLogModel;
