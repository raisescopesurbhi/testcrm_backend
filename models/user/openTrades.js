const mongoose = require("mongoose");

const openTradesSchema = new mongoose.Schema(
  {}, // No need to define fields
  {
    strict: false,    // Allows storing any fields dynamically
    timestamps: true, // Adds createdAt and updatedAt
  }
);

const openTradesModel = mongoose.model("openTrades", openTradesSchema);
module.exports = openTradesModel;
