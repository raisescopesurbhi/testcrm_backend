const mongoose= require("mongoose");
const sessionSchema = new mongoose.Schema({
  userId: {
     type: String,
    ref: "User",
  },

  sessionId: {
    type: String,
    unique: true
  },

  role: {
    type: String,
    enum: ["superadminusers", "adminusers", "users"],
    default:"users",
  },

  refreshToken: String,

  isRevoked: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  expiresAt: Date,
});

const SessionModel=mongoose.model("SessionModel",sessionSchema);
module.exports=SessionModel;
