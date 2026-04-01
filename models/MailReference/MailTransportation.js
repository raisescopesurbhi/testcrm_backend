const mongoose = require("mongoose");

const MailSchema = new mongoose.Schema({
  emailId: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CustomMailModel = mongoose.model("CustomMail", MailSchema);

module.exports = CustomMailModel;