// models/TransferSnapshot.js
const mongoose= require("mongoose");

const TxnMetaSchema = new mongoose.Schema(
  {
    status: String,          // "success" / "failed" etc
    message: String,         // "Transaction succefull."
    Message: String,         // "Transaction success"
    error: Boolean,          // false/true
    Result: Boolean,         // true/false
    Ticket: Number,          // 3438279
    Amount: String,          // "5"
    MT5Accont: Number,       // 248551
  },
  { _id: false }
);

const TransferSnapshotSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    fromAccount: { type: Number, required: true },
    toAccount: { type: Number, required: true },
    amount: { type: Number, required: true },
    comment: { type: String, default: "transfer" },

    userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
   accountType: {
      type: String,

     },

    status: {
      type: String,
      enum: ["initiated", "withdraw_failed", "deposit_failed", "completed"],
      default: "initiated",
      index: true,
    },

    withdrawal: { type: TxnMetaSchema, default: null },
    deposit: { type: TxnMetaSchema, default: null },

    errorMessage: { type: String, default: "" },
  },
  { timestamps: true }
);
const TransferSnapshot = mongoose.model("TransferSnapshot", TransferSnapshotSchema);
module.exports = TransferSnapshot;
