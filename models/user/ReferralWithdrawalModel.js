const mongoose = require("mongoose");

const referalWithdrawalScema = new mongoose.Schema(
  {
    referralId: {
      type: String,
    },
    method: {
      type: String,
    },
    amount: {
      type: Number,
    },
    status: {
      type: String,
      default: "pending",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    managerIndex: {
      type: Number,
    },
    totalBalance: {
      type: String,
    },
    level: {
      type: Number,
    },
  },
  { timestamps: true }
);

const referalWithdrawalModel = mongoose.model(
  "referalWithdrawals",
  referalWithdrawalScema
);
module.exports = referalWithdrawalModel;
