const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    mt5Account: {
      type: String,
      required: true,
    },
    deposit: {
      type: String,
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
    accountType: {
      type: String,
      required: true,
    },
    depositSS: {
      type: String,
    },
    bonus: {
      type: String,
    },
    method: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String,
    },
  },
  { timestamps: true }
);

const DepositModel = mongoose.model("deposit", transactionSchema);

module.exports = DepositModel;
