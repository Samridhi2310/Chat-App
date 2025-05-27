import dotenv from "dotenv";
dotenv.config(); // Make sure to load .env variables
import mongoose from "mongoose";



const connectDB = async () => {
  try {
    console.log(process.env.MONGODB_URI)
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database connected");
  } catch (err) {
    console.error("Database not connected", err);
  }
};

export default connectDB;

