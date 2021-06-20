const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const app = express();
const formatMessage = require("./utils/messages");
const {
  userJoin,
  userLeave,
  getCurrentUser,
  getRoomUsers,
} = require("./utils/users");

const server = http.createServer(app);
const io = socketio(server);

//Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "Chatcord Bot";

//Run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);
    //Welcome current user
    //This is to send to single client
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));

    //This is to send to all clients except the one thats connecting
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );
    //this is for all the clients in general
    //   io.emit();
    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  //Runs when the client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );
      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
