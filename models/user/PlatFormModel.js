const mongoose = require("mongoose");
const platformScema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    status: {
      type: String,
    },
  },
  { timestamps: true }
);

const platformModel =
  mongoose.models.platform || mongoose.model("platform", platformScema);

module.exports = platformModel;

