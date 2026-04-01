const NotificationModal = require("../models/notification");

// ✅ Get all notifications for a user
const user_getAllNotifications = async (req, res) => {
  try {
    const { userId } = req.params; // or get from auth token
    if (!userId)
      return res
        .status(400)
        .json({ success: false, message: "UserId required" });

    const notifications = await NotificationModal.find({ userId }).sort({
      createdAt: -1,
    }); // latest first

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (err) {
    console.error("Error fetching user notifications:", err);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: err.message });
  }
};

// ✅ Get all notifications for admin
const admin_getAllNotifications = async (req, res) => {
  try {
    // You can filter based on userId = null or some admin notifications type
    const notifications = await NotificationModal.find({ userId: null }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (err) {
    console.error("Error fetching admin notifications:", err);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: err.message });
  }
};


const mark_notification_read = async (req, res) => {
  try {
    const notificationId = req.params.id;

    // Find and update the notification
    const notification = await NotificationModal.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true } // return updated document
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, message: "Notification marked as read", data: notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const admin_mark_notification_read = async (req, res) => {
  try {
    const notificationId = req.params.id;

    // Find and update the notification
    const notification = await NotificationModal.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true } // return updated document
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, message: "Notification marked as read", data: notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  admin_mark_notification_read,
  user_getAllNotifications,
  mark_notification_read,
  admin_getAllNotifications,
};
