import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import createSuperAdmin from "./utils/createSuperAdmin.js";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const app = express();

// Security headers
app.use(helmet());

// CORS — restrict to known frontend origin
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5178",
  "http://localhost:5179"
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow ANY localhost port
    if (origin.startsWith("http://localhost")) {
      return callback(null, true);
    }

    // Allow production frontend
    if (origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
}));
// Body parser with size limit to prevent abuse
app.use(express.json({ limit: "10kb" }));

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", activityRoutes);
app.use("/api/analytics", analyticsRoutes);


app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error(err));
