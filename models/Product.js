import mongoose from "mongoose";


const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
    },
    description: {
      type: String,
    },
    stock: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
    },
    views: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

productSchema.index({ views: -1 });
productSchema.index({ stock: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
