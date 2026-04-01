const mongoose = require("mongoose");

const NewChallengeScema = new mongoose.Schema(
  {
    managerIndex: {
      type: Number,
    },
    MT5Account: {
      type: Number,
    },
    masterPass: {
      type: String,
    },
    InvesterPass: {
      type: String,
    },
    fName: {
      type: String,
    },
    lName: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: Number,
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    country: {
      type: String,
    },
    State: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    balance: {
      type: String,
    },
    levrage: {
      type: Number,
    },
    groupName: {
      type: String,
    },
  },
  { timestamps: true }
);

const NewChallenge = mongoose.model("NewChallenge", NewChallengeScema);

module.exports = NewChallenge;
