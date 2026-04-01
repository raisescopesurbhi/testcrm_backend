const mongoose = require("mongoose");

const closeTradeSchema = new mongoose.Schema(
  {
    mt5Account: {
      type: String,
      required: [true, "MT5 Account is required"],
      trim: true,
    },
    ticket: {
      type: String,
      trim: true,
    },
    lotSize: {  
      type: Number,
      required: [true, "Lot size is required"],
    },
    closePrice: {
      type: Number,
      required: true,
    },
    closeTime: {
      type: String,
      required: true,
    },
    openPrice: {
      type: Number,
      required: true,
    },
    openTime: {
      type: String,
      required: true,
    },
    profit: {
      type: Number,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    buySell: {
      type: Number,
      required: true,
    },
    positionId: {
      type: Number,
      unique: true,
      required: [true, "positionId is required"],
    },
    commissions: [
      {
        level: {
          type: Number,
          required: true,
        },
        commissionAmount: {
          type: Number,
          required: true,
        },
        ibAccountNumber: {
          type: Number,
          required: true,
        },
        isCalculated: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Validate unique levels within commissions array
closeTradeSchema.path("commissions").validate(function (commissions) {
  const levels = commissions.map((commission) => commission.level);
  const uniqueLevels = new Set(levels);
  return levels.length === uniqueLevels.size;
}, "Duplicate levels found in commissions array. Each level must be unique.");

// Index for efficient querying
closeTradeSchema.index({ mt5Account: 1, ticket: 1 });

const CloseTradeModel = mongoose.model("CloseTrade", closeTradeSchema);

module.exports = CloseTradeModel;