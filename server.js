const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auths");
const messageRoutes = require("./routes/messages");
const notificationRoutes = require("./routes/notification");
const socket = require("socket.io");
require("dotenv").config();
const http = require("http");
 
const app = express();
const server = http.createServer(app);


// ✅ Allow the correct frontend domain
const allowedOrigins = [
  "https://chat-app-delta-lemon.vercel.app", // Your Vercel frontend
  "http://localhost:3000", // Allow local development
];

// ✅ CORS Middleware (Allow PUT & DELETE)
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"], // ✅ Allow PUT & DELETE
    credentials: true, // Allow cookies/auth tokens if needed
  })
);

// app.use((req, res, next) => {
//   res.setHeader(
//     "Content-Security-Policy",
//     "default-src 'self'; style-src 'self' https://cdnjs.cloudflare.com;"
//   );
//   next();
// });


app.use((req, res, next) => {
  res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; connect-src 'self' wss://chat-app-backend-2ph1.onrender.com https://chat-app-backend-2ph1.onrender.com;"
  );
  next();
});
 
 
app.use(express.json());
app.use(express.static('public'));

// ✅ Initialize Socket.io
const io = socket(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"], // ✅ Allow PUT & DELETE
    credentials: true,
  },
});

 
// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("DB Connection Successful"))
  .catch((err) => console.error("Error connecting to DB:", err.message));
 
// API routes
app.use("/api/auths", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notification",notificationRoutes(io))

 
const PORT = "https://chat-app-backend-2ph1.onrender.com" || 5000; // Use Render's assigned port or default to 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
global.onlineUsers = new Map();

const users = {}; // Store active users

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

   // Handle user joining and store user email
   socket.on("add-user", (email) => {
    global.onlineUsers.set(email, socket.id);
    console.log(`✅ User ${email} added to online users.`);
  });

  // Handle real-time notifications
  socket.on("send-notification", ({ email, message }) => {
    const userSocketId = global.onlineUsers.get(email);
    if (userSocketId) {
      io.to(userSocketId).emit("new-notification", { email, message });
    }
  });

  // Store the user and their socket ID
  socket.on("join", (userId) => {
    users[userId] = socket.id;
    console.log(`User ${userId} is online with socket ID ${socket.id}`);
    io.emit("active-users", Object.keys(users));
  });

  // Handle message sending
  socket.on("send-msg", ({ to, msg, from }) => {
    console.log(`Message from ${from} to ${to}:`, msg);

    if (users[to]) {
      console.log(`Sending message to user: ${to}, Socket ID: ${users[to]}`);
      io.to(users[to]).emit("msg-receive", { msg, from }); // Send message instantly!
    } else {
      console.log("Recipient is offline or not connected.");
    }
  });

  // Remove disconnected user
  socket.on("disconnect", () => {
    Object.keys(users).forEach((key) => {
      if (users[key] === socket.id) {
        console.log(`User ${key} disconnected`);
        delete users[key];
      }
    });
  });
});