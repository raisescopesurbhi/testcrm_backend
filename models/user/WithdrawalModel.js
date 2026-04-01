const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    mt5Account: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    lastBalance: {
      type: String,
    },
  },
  { timestamps: true }
);

const WithdawalModel = mongoose.model("withdrawal", transactionSchema);
module.exports = WithdawalModel;
