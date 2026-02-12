import express from "express";
import Product from "../models/Product.js"; 
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

const upload = multer({ storage });

/**
 * GET /api/products
 * Fetch all products
 */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();

    // Extra: helpful log
    console.log("Fetched products:", products.length);

    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/products
 * Create a product
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
   const { name, price, description, stock } = req.body;


    // Basic validation (SAFE addition)
    if (!name || !price) {
      return res.status(400).json({
        message: "Name and price are required",
      });
    }

    const product = new Product({
      name,
      price,
     image: req.file ? req.file.path : "",
      description: description || "",
      stock: stock || 0,
    });

    const savedProduct = await product.save();

    console.log("Product added:", savedProduct.name);

    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("Error creating product:", error.message);
    res.status(400).json({ message: error.message });
  }
});
/* DELETE PRODUCT */
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* UPDATE PRODUCT */
router.put("/:id", async (req, res) => {
  try {
    const { name, price, image, description, stock } = req.body;

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        price,
        image,
        description,
        stock
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});





export default router;
