import { Server as SocketIoServer } from "socket.io";
import { Server } from "http";

export const initSocketServer = (server: Server) => {
  const io = new SocketIoServer(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("notifications", (data) => {
      console.log(data);
      io.emit("newNotifications", data);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
};
