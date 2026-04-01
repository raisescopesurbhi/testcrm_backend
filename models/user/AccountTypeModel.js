const mongoose = require("mongoose");

const accountTypeSchema = new mongoose.Schema(
  {
    apiGroup: {
      type: String,
    },
    accountType: {
      type: String,
    },

    leverage: [
      {
        label: { type: String },
        value: { type: String },
      },
    ],
    accountSize: [
      {
        deposit: { type: String },
        balance: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const accountTypeModel = mongoose.model("accountType", accountTypeSchema);

module.exports = accountTypeModel;
