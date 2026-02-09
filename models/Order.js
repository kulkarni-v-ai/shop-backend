import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    items: [
      {
        name: String,
        price: Number,
        qty: Number,
        image: String,
      },
    ],
    total: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
