const mongoose = require("mongoose");

const rulesScema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    color: {
      type: String,
    },
    status: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

const rulesModel = mongoose.model("rules", rulesScema);

module.exports = rulesModel;
