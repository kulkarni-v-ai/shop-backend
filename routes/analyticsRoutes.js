import express from "express";
import verifyToken, { authorize } from "../middleware/auth.js";
import { getStats, getSystemOverview } from "../controllers/analyticsController.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Apply rate limiting specifically to analytics & monitoring to prevent heavy DB load
const analyticsLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 requests per windowMs
    message: { message: "Too many requests to analytics endpoints, please try again later." }
});

router.use(analyticsLimiter);

// GET /api/analytics/stats -> Allowed for Manager, Admin, Superadmin
router.get("/stats", verifyToken, authorize("superadmin", "admin", "manager"), getStats);

// GET /api/analytics/system-overview -> Strictly Superadmin
router.get("/system-overview", verifyToken, authorize("superadmin"), getSystemOverview);

export default router;
