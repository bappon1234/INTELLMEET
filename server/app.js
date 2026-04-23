import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import "./config/passport.js";

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import passport from "passport";

import authRoutes from "./routes/authRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import teamMeetingRoutes from "./routes/teamMeetingRoutes.js";
import Message from "./models/chatModel.js";

connectDB();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://intellmeet.netlify.app"
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/team-meetings", teamMeetingRoutes);

app.get("/", (req, res) => {
  res.send("API Running");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const meetingUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-user-room", ({ userId }) => {
    if (!userId) return;
    socket.join(userId);
    socket.data.userId = userId;
    console.log(`User ${userId} joined personal room`);
  });

  socket.on("join-meeting", ({ meetingId, userId, name }) => {
    if (!meetingId) return;

    socket.join(meetingId);
    socket.data.meetingId = meetingId;
    socket.data.userId = userId || null;
    socket.data.name = name || "Guest";

    const users = meetingUsers.get(meetingId) || [];

    const existingUsers = users.map((user) => ({
      socketId: user.socketId,
      userId: user.userId,
      name: user.name,
    }));

    socket.emit("existing-users", existingUsers);

    const newUser = {
      socketId: socket.id,
      userId: userId || null,
      name: name || "Guest",
    };

    meetingUsers.set(meetingId, [...users, newUser]);

    socket.to(meetingId).emit("user-joined", newUser);

    console.log(`${socket.id} joined meeting ${meetingId}`);
  });

  socket.on("offer", ({ meetingId, to, sdp }) => {
    if (!to || !meetingId || !sdp) return;

    io.to(to).emit("offer", {
      from: socket.id,
      meetingId,
      sdp,
      name: socket.data.name || "Guest",
      userId: socket.data.userId || null,
    });
  });

  socket.on("answer", ({ meetingId, to, sdp }) => {
    if (!to || !meetingId || !sdp) return;

    io.to(to).emit("answer", {
      from: socket.id,
      meetingId,
      sdp,
    });
  });


  socket.on("ice-candidate", ({ meetingId, to, candidate }) => {
    if (!to || !meetingId || !candidate) return;

    io.to(to).emit("ice-candidate", {
      from: socket.id,
      meetingId,
      candidate,
    });
  });


  socket.on("send-message", async (data) => {
    try {
      const { meetingId, sender, senderName, message } = data;

      if (!meetingId || !message) return;

      const newMessage = await Message.create({
        meetingId,
        sender: sender || socket.data.userId || socket.id,
        senderName: senderName || socket.data.name || "Guest",
        message,
      });

      io.to(meetingId).emit("receive-message", {
        _id: newMessage._id,
        meetingId: newMessage.meetingId,
        sender: newMessage.sender,
        senderName: newMessage.senderName,
        message: newMessage.message,
        createdAt: newMessage.createdAt,
      });
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });


  socket.on("typing", ({ meetingId, userId, name }) => {
    socket.to(meetingId).emit("user-typing", {
      userId: userId || socket.data.userId || socket.id,
      name: name || socket.data.name || "Guest",
    });
  });


  socket.on("media-state-changed", ({ meetingId, isVideoOn, isAudioOn }) => {
    socket.to(meetingId).emit("media-state-changed", {
      userId: socket.id,
      isVideoOn,
      isAudioOn,
    });
  });


  socket.on("notify", (data) => {
    const { userId } = data;
    if (!userId) return;

    io.to(userId).emit("notification", data);
  });


  socket.on("leave-meeting", ({ meetingId }) => {
    const roomId = meetingId || socket.data.meetingId;
    if (!roomId) return;

    const users = meetingUsers.get(roomId) || [];
    const updatedUsers = users.filter((user) => user.socketId !== socket.id);

    if (updatedUsers.length > 0) {
      meetingUsers.set(roomId, updatedUsers);
    } else {
      meetingUsers.delete(roomId);
    }

    socket.leave(roomId);
    socket.to(roomId).emit("user-left", socket.id);

    console.log(`${socket.id} left meeting ${roomId}`);
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.meetingId;

    if (roomId) {
      const users = meetingUsers.get(roomId) || [];
      const updatedUsers = users.filter((user) => user.socketId !== socket.id);

      if (updatedUsers.length > 0) {
        meetingUsers.set(roomId, updatedUsers);
      } else {
        meetingUsers.delete(roomId);
      }

      socket.to(roomId).emit("user-left", socket.id);
    }

    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});