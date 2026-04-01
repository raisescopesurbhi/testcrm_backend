const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    details: {
      type: String,
    },
    status: {
      type: String,
    },
    image: {
      type: String,
    },
    bankTransfer: {
      bankName: { type: String },
      accountNumber: { type: String },
      accountHolderName: { type: String },
      ifscCode: { type: String },
    },
  },
  { timestamps: true }
);

const paymentMethodModel =
  mongoose.models.paymentMethod ||
  mongoose.model("paymentMethod", paymentSchema);

module.exports = paymentMethodModel;
