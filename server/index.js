import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Import routes
import authRoutes from "./routes/auth.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import reminderRoutes from "./routes/reminders.js";
import userRoutes from "./routes/users.js";

// Environment setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

const app = express();
const PORT = process.env.PORT || 5000;

// Configure middleware - order is important
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: [
      "https://yellow-moss-029856a00.4.azurestaticapps.net",
      "https://subtracker-ecefchh5fxaya5c4.eastasia-01.azurewebsites.net",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/users", userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Production specific configuration
if (process.env.NODE_ENV === "production") {
  app.use(express.static(join(__dirname, "../dist")));

  // SPA fallback - must be after API routes
  app.get("*", (req, res) => {
    res.sendFile(join(__dirname, "../dist", "index.html"));
  });
}

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
