import app from "./app";
import dotenv from "dotenv";
import connectDb from "./utils/db";
import cloudinary from "cloudinary";
import http from "http";
import { initSocketServer } from "./socketServer";
dotenv.config();

const server = http.createServer(app);

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUDNAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_APIKEY_SECRET,
});

initSocketServer(server);

server.listen(process.env.PORT, async () => {
  console.log(`Server is running on port ${process.env.PORT}.`);
  await connectDb();
});
