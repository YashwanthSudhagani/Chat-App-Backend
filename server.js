const express = require("express");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const authRoutes = require("./routes/auths");
const messageRoutes = require("./routes/messages");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:3000", methods: ["GET", "POST"], credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("DB Connection Successful"))
  .catch((err) => console.error("Error connecting to DB:", err));

// API Routes
app.use("/api/auths", authRoutes);
app.use("/api/messages", messageRoutes);

// Start Server
const server = app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend origin
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Global store for online users
global.onlineUsers = new Map();

// Socket.IO Configuration
io.on("connection", (socket) => {
  console.log(`New user connected: ${socket.id}`);

  // Add user to the online users map
  socket.on("add-user", (userId) => {
    if (userId) {
      global.onlineUsers.set(userId, socket.id);
      console.log(`User ${userId} added with socket ID: ${socket.id}`);
    }
  });

  // Handle chat requests
  socket.on("chat-request", ({ from, to, message }) => {
    const recipientSocketId = global.onlineUsers.get(to);

    if (recipientSocketId) {
      console.log(`Sending chat request from ${from} to ${to}`);
      socket.to(recipientSocketId).emit("msg-recieve", {
        msg: message,
        from,
        isChatRequest: true,
      });
    } else {
      console.warn(`Recipient ${to} is not online for chat request.`);
    }

    // Save chat request to the database
    new Message({ from, to, message, isChatRequest: true })
      .save()
      .then((savedMessage) => console.log("Chat request saved:", savedMessage))
      .catch((err) => console.error("Error saving chat request:", err));
  });

  // Handle sending messages
  socket.on("send-msg", async ({ to, msg, isChatRequest }) => {
    if (!to || !msg) {
      console.error("Invalid data in send-msg event:", { to, msg });
      return;
    }

    const recipientSocketId = global.onlineUsers.get(to);
    if (recipientSocketId) {
      console.log(`Recipient ${to} is online. Emitting message.`);
      socket.to(recipientSocketId).emit("msg-recieve", { msg, from: socket.id, isChatRequest });
    } else {
      console.log(`Recipient ${to} is offline. Saving message to DB.`);
      // Save the message to DB for offline users
      try {
        await new Message({ from: socket.id, to, message: msg, isChatRequest }).save();
      } catch (error) {
        console.error("Error saving message to DB:", error);
      }
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    // Remove the disconnected user from the online users map
    for (let [userId, socketId] of global.onlineUsers.entries()) {
      if (socketId === socket.id) {
        global.onlineUsers.delete(userId);
        break;
      }
    }
  });
});
