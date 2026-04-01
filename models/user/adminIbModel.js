const mongoose = require("mongoose");

const adminIbSchema = new mongoose.Schema(
  {
    accountType: {
      type: String,
      required: true,
    },
    accountTypeId: {
      type: String,
      required: true,
    },
    level: {
      type: Number,
      required: true,
    },
    commission: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  { timestamps: true }
);

const adminIbModel = mongoose.model("admin_ib", adminIbSchema);

module.exports = adminIbModel;
