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
    images: {
      type: [String],
      default: [],
    },
    // Keep legacy field for backward compatibility with existing data
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
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual: always return a flat images array (merge legacy `image` into `images`)
productSchema.methods.getAllImages = function () {
  const imgs = this.images && this.images.length > 0 ? [...this.images] : [];
  if (this.image && !imgs.includes(this.image)) {
    imgs.unshift(this.image);
  }
  return imgs;
};

productSchema.index({ views: -1 });
productSchema.index({ stock: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
