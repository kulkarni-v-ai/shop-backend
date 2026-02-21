import express from "express";
import Order from "../models/Order.js";
import verifyToken, { authorize } from "../middleware/auth.js";
import { logAction } from "../utils/logger.js";

const router = express.Router();

/**
 * POST /api/orders
 * Create an order (public — customers place orders)
 */
router.post("/", async (req, res) => {
  try {
    const { items, total, userId, shippingAddress } = req.body;

    const order = new Order({
      items,
      total,
      user: userId || null,
      shippingAddress: shippingAddress || null
    });
    const saved = await order.save();

    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/orders
 * Get all orders (admin/manager/superadmin)
 */
router.get("/", verifyToken, authorize("superadmin", "admin", "manager"), async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/orders/:id
 * Update order status (superadmin/admin/manager)
 */
router.put("/:id", verifyToken, authorize("superadmin", "admin", "manager"), async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    await logAction({
      userId: req.admin.id,
      role: req.admin.role,
      actionType: "UPDATE_ORDER",
      targetId: req.params.id,
      metadata: { newStatus: req.body.status },
      ipAddress: req.ip
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
