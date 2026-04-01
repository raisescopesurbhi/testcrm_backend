// notificationService.js
const Notification = require("../models/notification"); // path to your model

/**
 * Create and save a new notification
 * @param {Object} params
 * @param {String} params.type - Type of notification (e.g., "NEW_USER", "PAYMENT")
 * @param {String} params.title - Notification title
 * @param {String} params.message - Notification message
 * @param {mongoose.Types.ObjectId} [params.entityId] - Related entity id
 * @param {String} [params.entityType] - Related entity type ("User", "Payment", "Post")
 * @param {String} [params.userLink] - Frontend link for users
 * @param {String} [params.adminLink] - Frontend link for admins
 * @returns {Promise<Object>} - Saved notification document
 */


async function pushNotification({
  userId = null,
  type,
  title,
  message,
  entityId = null,
  entityType = null,
  userLink = null,
  adminLink = null,
}) {
  try {
    const newNotification = new Notification({
      userId,
      type,
      title,
      message,
      entityId,
      entityType,
      userLink,
      adminLink,
    });

    const savedNotification = await newNotification.save();
    return savedNotification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

module.exports = { pushNotification };
