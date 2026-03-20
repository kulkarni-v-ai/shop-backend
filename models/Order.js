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

    status: {
      type: String,
      default: "Pending",
    },

  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);
