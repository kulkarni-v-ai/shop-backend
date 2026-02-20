import express from "express";
import verifyToken, { authorize } from "../middleware/auth.js";
import { getLogs, archiveLog } from "../controllers/activityController.js";

const router = express.Router();

// Both routes are strictly protected for Superadmin only
router.get("/system-logs", verifyToken, authorize("superadmin"), getLogs);
router.patch("/system-logs/archive/:id", verifyToken, authorize("superadmin"), archiveLog);

export default router;
