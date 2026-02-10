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


// UPDATE ORDER STATUS
router.put("/:id", async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
