const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User model
  message: { type: String, required: true }, // The notification message
  read: { type: Boolean, default: false }, // Flag to mark the notification as read or not
  timestamp: { type: Date, default: Date.now }, // Timestamp for when the notification was created
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
