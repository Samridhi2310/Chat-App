import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import cookieParser from "cookie-parser";
import Group from "./models/groupModel.js";
import groupRoutes from "./routes/groupRoutes.js"

const app = express();
app.use(cors( {
  origin: 'http://localhost:3000', // Replace with your client's origin
  credentials: true,
}));
app.use(cookieParser())
app.use(express.json());
app.use("/api", userRoutes);
app.use("/api", chatRoutes);
app.use("/api",groupRoutes)

const server = app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
connectDB();

const io = new Server(server, {
  cors: {
  origin: 'http://localhost:3000', // Replace with your client's origin
    methods: ["GET", "POST"],
  },
});

const users = {};
const rooms = {};

io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);

  socket.on("join", ({ username }) => {
    users[socket.id] = username;
    socket.join("global");
   
    io.emit("active-users", Object.values(users));
  });

  socket.on("message", ({ userId, message, room, to }) => {
    const msg = {
      userId,
      message,
      id: `${userId}-${Date.now()}-${Math.random()}`,
      room: room || null,
      to: to || null,
    };

    if (to && Object.values(users).includes(to)) {
      const recipientSocketId = Object.keys(users).find(
        (key) => users[key] === to
      );
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("message", msg);
        socket.emit("message", msg);
      }
    } else if (room) {
      io.to(room).emit("message", msg);
    } else {
      io.emit("message", msg);
    }
  });

  socket.on("join-room", ({ username, room }) => {
    socket.join(room);
    console.log(`${username} joined room ${room}`);

  });

  socket.on("create-room",async  ({ roomName, users: usersToInvite, creator }) => {
    if (!rooms[roomName]) {
      rooms[roomName] = {
        name: roomName,
        members: [creator, ...usersToInvite],
        messages: [],
      };
      [creator, ...usersToInvite].forEach((username) => {
        const userSocketId = Object.keys(users).find(
          (key) => users[key] === username
        );
        if (userSocketId) {
          io.sockets.sockets.get(userSocketId)?.join(roomName);
        }
      });
      io.to(roomName).emit("message", {
        userId: "System",
        message: `${creator} created room "${roomName}" with members: ${[
          creator,
          ...usersToInvite,
        ].join(", ")}`,
        id: `system-room-created-${roomName}-${Date.now()}`,
            room: roomName,
      });
      [creator, ...usersToInvite].forEach((username) => {
        const userSocketId = Object.keys(users).find(
          (key) => users[key] === username
        );
        if (userSocketId) {
          io.to(userSocketId).emit("room-created", rooms[roomName]);
        }
      });
      io.emit("rooms", Object.values(rooms));
      console.log(rooms);
    }
  });

  socket.on("leave-group", async ({ username, room }) => {
    if (rooms[room]) {
      rooms[room].members = rooms[room].members.filter(
        (user) => user !== username
      );
      socket.leave(room);
      console.log(`${username} left room ${room}`);
            try {
        await Group.findOneAndUpdate(
          { name: room },
          { $pull: { members: username } }
        );
        console.log(`${username} removed from DB group ${room}`);
      } catch (err) {
        console.error("Error updating group in DB:", err);
      }

      io.to(room).emit("message", {
        userId: "System",
        message: `${username} has left the room`,
        id: `system-leave-room-${username}-${room}-${Date.now()}`,
        room,
      });
      io.to(room).emit("room-updated", rooms[room]);
      io.emit("rooms", Object.values(rooms));
      if (rooms[room].members.length === 0) {
        delete rooms[room];
        try {
          await Group.deleteOne({ name: room });
          console.log(`Deleted empty group "${room}" from DB`);
        } catch (err) {
          console.error("Error deleting group from DB:", err);
        }

        io.emit("rooms", Object.values(rooms));
        console.log(`Room ${room} deleted because it's empty`);
      }
    }
  });
  // Typing indicator for private chats or global chat
socket.on("typing", ({ from, to, room }) => {
  if (to) {
    // For private message
    const recipientSocketId = Object.keys(users).find(
      (key) => users[key] === to
    );
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("typing", { from });
    }
  } else if (room) {
    // For room chat
    socket.to(room).emit("typing", { from });
  } else {
    // For global chat
    socket.broadcast.emit("typing", { from });
  }
});

socket.on("stop-typing", ({ from, to, room }) => {
  if (to) {
    const recipientSocketId = Object.keys(users).find(
      (key) => users[key] === to
    );
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("stop-typing", { from });
    }
  } else if (room) {
    socket.to(room).emit("stop-typing", { from });
  } else {
    socket.broadcast.emit("stop-typing", { from });
  }
});



  socket.emit("active-users", Object.values(users));
  socket.emit("rooms", Object.values(rooms));

  socket.on("disconnect", () => {
    const username = users[socket.id] || "A user";
    console.log(`${username} disconnected`);
  
    delete users[socket.id];
    io.emit("active-users", Object.values(users));
  });
});