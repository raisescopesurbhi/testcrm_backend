const mongoose = require("mongoose");
const customGroupScema = new mongoose.Schema(
  {
    apiGroup: {
      type: String,
    },
    customGroup: {
      type: String,
    },
  },
  { timestamps: true }
);

const customGroupModel =
  mongoose.models.customGroup ||
  mongoose.model("customGroup", customGroupScema);

module.exports = customGroupModel;
