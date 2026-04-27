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
import authRoutes from "./routes/authRoutes.js";
import cmsRoutes from "./routes/cmsRoutes.js";
import createSuperAdmin from "./utils/createSuperAdmin.js";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const app = express();

// Security headers
app.use(helmet());

// CORS — restrict to known frontend origin
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173", 
    "https://houseofvisuals.co.in", 
    "https://www.houseofvisuals.co.in",
    "https://hov-admin.vercel.app",
    "https://hov-admin.netlify.app",
    "http://localhost:5174",
    "http://localhost:5175"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}));

// Body parser with size limit to prevent abuse
app.use(express.json({ limit: "1mb" }));

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", activityRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cms", cmsRoutes);


app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    // Sync owner account (devcobraaa) from env on every startup
    await createSuperAdmin();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error(err));
