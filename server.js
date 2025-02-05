const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auths");
const messageRoutes = require("./routes/messages");
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

// CORS Middleware
app.use(
  cors({
      origin: function (origin, callback) {
          if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true);
          } else {
              callback(new Error("Not allowed by CORS"));
          }
      },
      credentials: true, // Allow cookies/auth tokens if needed
  })
);
app.use((req, res, next) => {
  res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; connect-src 'self' wss://chat-app-backend-2ph1.onrender.com https://chat-app-backend-2ph1.onrender.com;"
  );
  next();
});

 
app.use(express.json());
app.use(express.static('public'));

 
// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("DB Connection Successful"))
  .catch((err) => console.error("Error connecting to DB:", err.message));
 
// API routes
app.use("/api/auths", authRoutes);
app.use("/api/messages", messageRoutes);

 
// Start the server
server.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
 
// ✅ Socket.io Configuration with Correct CORS
const io = socket(server, {
  cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
  },
});

 
// Store active users (you can replace this with a more persistent solution like a database)
let users = {};
 
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
 
    // Store user ID with socket ID
    socket.on("join", (userId) => {
        users[userId] = socket.id;
        console.log(`User ${userId} is online with socket ID ${socket.id}`);
    });
 
    // Handle user disconnect
    socket.on("disconnect", () => {
        Object.keys(users).forEach((key) => {
            if (users[key] === socket.id) {
                console.log(`User ${key} disconnected`);
                delete users[key];
            }
        });
    });
}); 