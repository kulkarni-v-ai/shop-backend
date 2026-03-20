import express from "express";
import Product from "../models/Product.js";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import verifyToken, { authorize } from "../middleware/auth.js";
import { logAction } from "../utils/logger.js";

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
 * Fetch all products (public)
 */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/products
 * Create a product (admin/superadmin)
 */
router.post("/", verifyToken, authorize("superadmin", "admin"), upload.single("image"), async (req, res) => {
  try {
    const { name, price, description, stock } = req.body;

    const category = req.body.category || "General";

    if (!name || !price) {
      return res.status(400).json({
        message: "Name and price are required",
      });
    }

    const product = new Product({
      name,
      price: Number(price),
      image: req.file ? req.file.path : "",
      description: description || "",
      stock: stock || 0,
      category: category
    });

    const savedProduct = await product.save();

    await logAction({
      userId: req.admin.id,
      role: req.admin.role,
      actionType: "CREATE_PRODUCT",
      targetId: savedProduct._id,
      metadata: { name: savedProduct.name },
      ipAddress: req.ip
    });

    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(400).json({ message: error.message });
  }
});

/**
 * DELETE /api/products/:id
 * Delete a product (superadmin/admin only)
 */
router.delete("/:id", verifyToken, authorize("superadmin", "admin"), async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);

    await logAction({
      userId: req.admin.id,
      role: req.admin.role,
      actionType: "DELETE_PRODUCT",
      targetId: req.params.id,
      ipAddress: req.ip
    });

    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * PUT /api/products/:id
 * Update a product (superadmin/admin only)
 */
router.put("/:id", verifyToken, authorize("superadmin", "admin"), upload.single("image"), async (req, res) => {
  try {
    const { name, price, description, stock, category } = req.body;

    const updateData = {
      name,
      price,
      description,
      stock,
      category,
    };

    if (req.file) {
      updateData.image = req.file.path;
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    await logAction({
      userId: req.admin.id,
      role: req.admin.role,
      actionType: "UPDATE_PRODUCT",
      targetId: req.params.id,
      metadata: { name: updated.name },
      ipAddress: req.ip
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Simple IP-based in-memory cache to debounce views from the same IP
const viewCache = new Map();

/**
 * POST /api/products/:id/view
 * Increment product view count (public fire-and-forget)
 */
router.post("/:id/view", async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const productId = req.params.id;
    const cacheKey = `${ip}_${productId}`;

    // Prevent duplicate views within 5 minutes (300,000 ms)
    if (viewCache.has(cacheKey)) {
      const lastViewTime = viewCache.get(cacheKey);
      if (Date.now() - lastViewTime < 5 * 60 * 1000) {
        return res.status(200).json({ message: "View already counted recently" });
      }
    }

    viewCache.set(cacheKey, Date.now());

    await Product.findByIdAndUpdate(productId, { $inc: { views: 1 } });
    res.status(200).json({ message: "View recorded" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
