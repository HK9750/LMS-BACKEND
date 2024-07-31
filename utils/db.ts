import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const DB_URL: string = process.env.MONGO_URL || "";

const connectDb = async () => {
  try {
    await mongoose.connect(DB_URL).then((data: any) => {
      console.log("Connected to the database:", data.connection.host);
    });
  } catch (error: any) {
    console.log("Error: ", error.message);
    setTimeout(connectDb, 4000);
  }
};

export default connectDb;
