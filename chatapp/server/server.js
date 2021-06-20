const express = require("express");
const app = express();
const socketio = require("socket.io");
const http = require("http");
const router = require("./router");

const server = http.createServer(app);
const io = socketio(server);

const { getUser, getUsersInRoom, removeUser, addUser } = require("./users");

io.on("connection", (socket) => {
  console.log("A user has joined the chat");

  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });
    if (error) {
      return callback(error);
    }

    //only for the user who joined
    socket.emit("message", {
      user: "Admin",
      text: `${user.name}, welcome to the room ${user.room}`,
    });

    //everyone except the user who has joined
    socket.broadcast.to(user.room).emit("message", {
      user: "Admin",
      text: `${user.name} has joined the chat`,
    });
    socket.join(user.room);
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    // console.log(user);
    io.to(user.room).emit("message", { user: user.name, text: message });

    callback();
  });

  socket.on("disconnect", () => {
    console.log("User has left the chat");
  });
});

app.use("/", router);

const PORT = 5000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
