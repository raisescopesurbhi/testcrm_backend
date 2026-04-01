const mongoose = require("mongoose");

const phaseScema = new mongoose.Schema(
  {
    accountType: {
      type: String,
      required: true,
    },
    phase: {
      type: Number,
    },
    maxProfit: {
      type: mongoose.Schema.Types.Mixed, // This allows both Number and Infinity
      set: (v) => (v === "Infinity" || v === Infinity ? Infinity : Number(v)),
      get: (v) => (v === Infinity ? "∞" : v),
    },
    maxDailyLoss: {
      type: mongoose.Schema.Types.Mixed,
      set: (v) => (v === "Infinity" || v === Infinity ? Infinity : Number(v)),
      get: (v) => (v === Infinity ? "∞" : v),
    },
    maxOverallLoss: {
      type: mongoose.Schema.Types.Mixed,
      set: (v) => (v === "Infinity" || v === Infinity ? Infinity : Number(v)),
      get: (v) => (v === Infinity ? "∞" : v),
    },
    minTradingDays: {
      type: Number,
    },
  },
  { timestamps: true }
);
const phaseModel = mongoose.model("phases", phaseScema);

module.exports = phaseModel;
