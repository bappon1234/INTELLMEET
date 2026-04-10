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


connectDB();

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(passport.initialize());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/teams", teamRoutes);

app.get("/", (req, res) => {
    res.send("API Running");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-meeting", (meetingId) => {
        socket.join(meetingId);
    });

    socket.on("offer", (data) => {
        socket.to(data.meetingId).emit("offer", data.offer);
    });

    socket.on("answer", (data) => {
        socket.to(data.meetingId).emit("answer", data.answer);
    });

    socket.on("ice-candidate", (data) => {
        socket.to(data.meetingId).emit("ice-candidate", data.candidate);
    });

    // socket.on("send-message", (data) => {
    //     io.to(data.meetingId).emit("receive-message", data);
    // });

    socket.on("send-message", async (data) => {
        try {
            const newMessage = await Message.create({
                meetingId: data.meetingId,
                sender: data.sender,
                message: data.message,
            });
            io.to(data.meetingId).emit("receive-message", newMessage);

        } catch (err) {
            console.error(err);
        }
    });

    socket.on("notify", (data) => {
        io.to(data.userId).emit("notification", data);
    });

    socket.on("disconnect", (data) => {
        console.log("User disconnected");
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});