import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

/* CREATE ORDER */
router.post("/", async (req, res) => {
  try {
    const { items, total } = req.body;

    const order = new Order({ items, total });
    const saved = await order.save();

    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET ORDERS */
router.get("/", async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

export default router;
