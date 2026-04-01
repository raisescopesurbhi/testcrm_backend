const mongoose = require("mongoose");

const superadminScema = new mongoose.Schema({
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
    default: "superadminusers",
  },
  

},{timestamps:true});

const superadminUserModel = mongoose.model("superadminusers", superadminScema);
module.exports = superadminUserModel;