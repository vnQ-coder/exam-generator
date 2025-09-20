import mongoose from "mongoose";
import { config } from "dotenv";

// Load environment variables
config();
if (!process.env.MONGODB_URI) {
  throw new Error(
    "MONGODB_URI must be set. Please provide a MongoDB connection string."
  );
}

console.log(process.env.MONGODB_URI);

// Connect to MongoDB
export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

// Handle connection events
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed through app termination");
  process.exit(0);
});
