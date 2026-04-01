const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel" }, // ← Add this
  type: { type: String, required: true }, // e.g. "new_user", "payment", "comment"
  title: { type: String, required: true }, // e.g. "New User Registered"
  message: { type: String, required: true }, // e.g. "John Doe has signed up"
  entityId: { type: mongoose.Schema.Types.ObjectId, refPath: "entityType" },
  entityType: { type: String }, // "User", "Payment", "Post"
  userLink: { type: String }, // frontend route for users (e.g. "/profile/123")
  adminLink: { type: String }, // frontend route for admins (e.g. "/admin/users/123")
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
