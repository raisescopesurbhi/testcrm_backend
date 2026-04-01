const mongoose = require("mongoose");

const adminUserScema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ["users", "adminusers", "superadminusers"],
    default: "adminusers",
  },
  

},{timestamps:true});

const adminUserModel = mongoose.model("adminusers", adminUserScema);
module.exports = adminUserModel;
