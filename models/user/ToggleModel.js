const mongoose = require("mongoose");
const toggleScema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
     description: {
      type: String,
  },
  enabled: {
      type: Boolean,
      default: true,
    },
},
  { timestamps: true }
);

const toggleModel =
  mongoose.models.toggle || mongoose.model("toggle", toggleScema);

module.exports = toggleModel;