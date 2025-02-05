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
 
// CORS configuration to allow frontend (localhost:3000)
app.use(
  cors({
    origin: "http://localhost:3000", // Frontend URL (make sure this matches)
    methods: ["GET", "POST"],
    credentials: true, // Allow cookies to be sent
  })
);
 
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
 
// Initialize Socket.IO
const io = socket(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend origin
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