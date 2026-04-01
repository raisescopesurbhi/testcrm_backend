const mongoose = require("mongoose");
const commissionScema = new mongoose.Schema(
  {
    mt5Account: {
      type: String,
    },
    referralId: {
      type: String,
    },
    accountType: {
      type: String,
    },
    depositAmount: {
      type: String,
    },
    commission: {
      type: String,
    },
    accountSize: {
      type: String,
    },
    depositBalance: {
      type: String,
    },
    level: {
      type: String,
    },
    referralFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    currentReferral: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);

const commissionModel = mongoose.model("commissions", commissionScema);

module.exports = commissionModel;
