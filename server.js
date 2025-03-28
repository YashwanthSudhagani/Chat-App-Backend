const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auths");
const messageRoutes = require("./routes/messages");
const notificationRoutes = require("./routes/notification");
const { router: logoutRouter, authenticateToken } = require('./routes/logout');
const inviteRoutes = require("./routes/inviteRoutes");
const roomRoutes = require("./routes/roomRoutes");
const usersRoutes = require("./routes/usersRoutes");
const crypto = require("crypto"); // For generating a random string
const { ExpressPeerServer } = require("peer");
const socket = require("socket.io");
require("dotenv").config();
const http = require("http");
const pollRoutes = require("./routes/Poll");
const Poll = require("./models/Poll");
const groupRoutes = require("./routes/groupRoutes")
 
const app = express();
const server = http.createServer(app);
const PORT = 5000; // Match with frontend
// ✅ Initialize PeerJS Server
const peerServer = ExpressPeerServer(server, {
  path: "/peerjs",
  debug: true,
});

// ✅ Allow the correct frontend domain
const allowedOrigins = [
  "https://chat-app-front-end-idnz.vercel.app",
  "http://localhost:3000",
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
 
 
// ✅ Ensure Express can handle JSON and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // Allow CORS if frontend and backend are on different domains
app.use(express.static('public'));
app.use("/uploads", express.static("uploads"));
app.use("/peerjs", peerServer); // ✅ Correct path
app.use("/api/groups", groupRoutes)


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
app.use('/api/logout', logoutRouter);
app.use("/api/polls", pollRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users",usersRoutes)


// Sample protected route
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

// Generate invite link route
// API endpoint to generate invite link
app.post("/api/invites/generate-invite", async (req, res) => {
  try {
    const { chatId } = req.body;

    // Validate chatId
    if (!chatId) {
      console.log("Missing chatId in request:", req.body); // Debug log
      return res.status(400).json({ error: "Chat ID is required" });
    }

    // Generate unique code
    const inviteCode = crypto.randomUUID();

    // Create new invite
    const newInvite = new Invite({
      chatId,
      inviteCode,
      createdAt: new Date(),
    });

    await newInvite.save();

    // Generate invite link
    const inviteLink = `https://chat-app-front-end-idnz.vercel.app/${inviteCode}`;

    // Emit socket event
    io.emit("new-invite", { chatId, inviteLink });

    return res.status(201).json({ inviteLink });
  } catch (error) {
    console.error("Error generating invite:", error);
    return res.status(500).json({ error: "Failed to generate invite" });
  }
});

 
// Start the server
server.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
 
global.onlineUsers = new Map();

const users = {}; // Store active users
const activeCalls = {}; // Store active calls

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

  socket.on('send-voice-msg', ({ to, audioUrl, from }) => {
    console.log(`Voice message from ${from} to ${to}:`, audioUrl);
    io.to(to).emit('receive-voice-msg', { audioUrl, from }); // Include `from`
  });

  
  socket.on("start-call", ({ callerId, receiverId, peerId }) => {
    console.log(`📞 Call initiated from ${callerId} to ${receiverId}`);
    activeCalls[receiverId] = callerId;
    io.to(receiverId).emit("incoming-call", { callerId, peerId });
  });

  socket.on("accept-call", ({ callerId, receiverId, peerId }) => {
    console.log(`✅ Call accepted by ${receiverId}`);
    io.to(callerId).emit("call-accepted", { peerId });
  });

  socket.on("decline-call", ({ callerId, receiverId }) => {
    console.log(`❌ Call declined by ${receiverId}`);
    delete activeCalls[receiverId];
    io.to(callerId).emit("call-declined");
  });

  socket.on("end-call", ({ callerId, receiverId }) => {
    console.log(`📴 Call ended between ${callerId} and ${receiverId}`);
    delete activeCalls[receiverId];
    io.to(receiverId).emit("call-ended");
    io.to(callerId).emit("call-ended");
  });

  socket.on("toggle-mute", ({ userId, isMuted }) => {
    console.log(`🔇 User ${userId} ${isMuted ? "muted" : "unmuted"}`);
    io.to(userId).emit("toggle-mute", { isMuted });
  });

  socket.on("hold-call", ({ userId, isOnHold }) => {
    console.log(`⏸️ User ${userId} ${isOnHold ? "on hold" : "resumed"}`);
    io.to(userId).emit("hold-call", { isOnHold });
  });

  socket.on("add-user-to-call", ({ roomId, newUserId }) => {
    console.log(`➕ Adding ${newUserId} to call in room ${roomId}`);
    io.to(roomId).emit("user-added", { newUserId });
  });


// Handle Socket.IO events
io.on("connection", (socket) => {
  socket.on("vote", async ({ pollId, optionId, userId }) => {
    try {
      const poll = await Poll.findById(pollId);
      if (!poll) {
        console.error("Poll not found:", pollId);
        return socket.emit("error", { message: "Poll not found" });
      }
  
      const optionIndex = poll.options.findIndex(opt => opt.id === optionId);
      if (optionIndex === -1) {
        console.error("Option not found:", optionId);
        return socket.emit("error", { message: "Option not found" });
      }
  
      // Remove previous vote if exists
      poll.options.forEach((option) => {
        option.voters = option.voters.filter(voterId => voterId !== userId);
        option.votes = option.voters.length;
      });
  
      // Add new vote
      poll.options[optionIndex].voters.push(userId);
      poll.options[optionIndex].votes = poll.options[optionIndex].voters.length;
  
      await poll.save();  // Save updated poll
      io.emit("poll_updated", poll);  // Notify clients
  
    } catch (error) {
      console.error("Vote error:", error);
      socket.emit("error", { message: "Failed to vote" });
    }
  });  
});

socket.on("delete_poll", async ({ pollId, userId }) => {
  const poll = await Poll.findById(pollId);
  if (!poll || poll.createdBy !== userId) return;

  await Poll.findByIdAndDelete(pollId);
  io.emit("poll_deleted", pollId); // Emit delete event
});


  // Handle real-time invites (to send the invite when it's created)
  socket.on("new-invite", (data) => {
    io.emit("new-invite", data);
    console.log("New invite sent to clients:", data);
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