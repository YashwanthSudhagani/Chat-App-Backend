// routes/notificationRoutes.js
const express = require('express');
const Notification = require('../models/notification');

module.exports = (io) => {
  const router = express.Router();

// POST route to manually create a notification (For testing purposes or when triggering notifications)
router.post('/add', async (req, res) => {
  const { message, email } = req.body; // Get message and email from the request body

  if (!message || !email) {
    return res.status(400).json({ message: 'Message and email are required.' });
  }

  try {
    // Create a new notification
    const newNotification = new Notification({ message, email });

    // Save the notification to the database
    await newNotification.save();

    // Emit the notification to the connected clients (using email to filter)
    const userSocketId = global.onlineUsers.get(email);
    if (userSocketId) {
      io.to(userSocketId).emit('new-notification', newNotification);
    }

    res.status(201).json({ message: 'Notification added successfully.' });
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ message: 'Failed to create notification.' });
  }
});

// GET route to fetch notifications for a user
router.get('/notifications/:email', async (req, res) => {
  const { email } = req.params; // Get email from URL params
  
  try {
    // Find notifications for the given email
    const notifications = await Notification.find({ email }).sort({ createdAt: -1 });

    // Get the count of unread notifications
    const unreadCount = await Notification.countDocuments({ email, read: false });

    res.json({
      notifications,
      unreadCount, // Send the unread count to the frontend
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
});

// POST route to mark notifications as read
router.put('/notifications/read/:email', async (req, res) => {
  const { email } = req.params;

  try {
    // Update all unread notifications for the user to read
    await Notification.updateMany({ email, read: false }, { read: true });

    res.json({ message: 'Notifications marked as read.' });
  } catch (err) {
    console.error('Error marking notifications as read:', err);
    res.status(500).json({ message: 'Failed to mark notifications as read.' });
  }
});

return router;
};