const mongoose = require("mongoose");

const userIbListSchema = new mongoose.Schema(
  {
    loggedUserReferralAccount: {
      type: String,
      required: [true, "account number is required"],
      trim: true,
    },
    accountNumber: {
      type: String,
      required: [true, "account number is required"],
      trim: true,
    },
    level: {
      type: Number,
      required: [true, "level is required"],
    },
    totalCommission: {
      type: Number,
      required: [true, "total Commission is required"],
      default: 0,
    },
    totalLot: {
      type: Number,
      required: [true, "total lot is required"],
      default: 0,
    },
    name: {
      type: String,
      trim: true,
      required: [true, "name is required"],
    },
    email: {
      type: String,
      trim: true,
      required: [true, "email is required"],
    },
    country: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const userIbListModel = mongoose.model("UserIbList", userIbListSchema);

module.exports = userIbListModel;
