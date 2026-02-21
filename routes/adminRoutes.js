import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import verifyToken, { authorize } from "../middleware/auth.js";
import { logAction } from "../utils/logger.js";
import { getStats } from "../controllers/analyticsController.js";

const router = express.Router();

/* ADMIN LOGIN */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create JWT token using env secret
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
      },
    });

    await logAction({
      userId: admin._id,
      role: admin.role,
      actionType: "LOGIN",
      metadata: { username: admin.username },
      ipAddress: req.ip
    });
  } catch (error) {
    console.error("Login Route Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

/* SUPERADMIN ONLY: CREATING USERS */
router.post("/register", verifyToken, authorize("superadmin"), async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
      username,
      password: hashedPassword,
      role: role || "manager",
    });

    const savedAdmin = await newAdmin.save();

    await logAction({
      userId: req.admin.id,
      role: req.admin.role,
      actionType: "CREATE_ADMIN",
      targetId: savedAdmin._id,
      metadata: { username: savedAdmin.username, newRole: savedAdmin.role },
      ipAddress: req.ip
    });

    res.status(201).json({
      _id: savedAdmin._id,
      username: savedAdmin.username,
      role: savedAdmin.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* SUPERADMIN ONLY: FETCH USERS */
router.get("/users", verifyToken, authorize("superadmin"), async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* SUPERADMIN ONLY: DELETE USER */
router.delete("/users/:id", verifyToken, authorize("superadmin"), async (req, res) => {
  try {
    // Explicit controller-level validation
    const adminToDelete = await Admin.findById(req.params.id);
    if (!adminToDelete) {
      return res.status(404).json({ message: "Admin not found" });
    }
    if (adminToDelete.role === "superadmin") {
      return res.status(403).json({ message: "Cannot delete a superadmin account" });
    }

    await Admin.findByIdAndDelete(req.params.id);

    await logAction({
      userId: req.admin.id,
      role: req.admin.role,
      actionType: "DELETE_ADMIN",
      targetId: req.params.id,
      ipAddress: req.ip
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* UNIVERSAL ADMIN UPDATE: Change username, role, or password (Superadmin Only) */
router.put("/users/:id", verifyToken, authorize("superadmin"), async (req, res) => {
  try {
    const { username, role, password } = req.body;
    const adminToUpdate = await Admin.findById(req.params.id);

    if (!adminToUpdate) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Protection logic for superadmins
    if (adminToUpdate.role === "superadmin" && req.admin.id !== adminToUpdate._id.toString()) {
      return res.status(403).json({ message: "Only a superadmin can edit themselves" });
    }

    if (username) adminToUpdate.username = username;

    // Role change protection: cannot demote last superadmin (implicitly handled if only one)
    if (role && adminToUpdate.role === "superadmin" && role !== "superadmin") {
      return res.status(403).json({ message: "Cannot demote a superadmin" });
    }
    if (role) adminToUpdate.role = role;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      adminToUpdate.password = await bcrypt.hash(password, salt);
    }

    await adminToUpdate.save();

    await logAction({
      userId: req.admin.id,
      role: req.admin.role,
      actionType: "ADMIN_UPDATE",
      targetId: req.params.id,
      metadata: { username: adminToUpdate.username, role: adminToUpdate.role },
      ipAddress: req.ip
    });

    res.json({
      message: "User updated successfully", admin: {
        _id: adminToUpdate._id,
        username: adminToUpdate.username,
        role: adminToUpdate.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* PERSONAL PROFILE UPDATE: Allow logged-in admin to change their own username/password */
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findById(req.admin.id);

    if (!admin) return res.status(404).json({ message: "Admin not found" });

    if (username) admin.username = username;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);
    }

    await admin.save();

    res.json({
      message: "Profile updated successfully",
      admin: { id: admin._id, username: admin.username, role: admin.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ADMIN ANALYTICS: Exposed at /api/admin/stats */
router.get("/stats", verifyToken, authorize("superadmin", "admin", "manager"), getStats);

/* CUSTOMER MANAGEMENT (Superadmin/Admin) */
router.get("/customers", verifyToken, authorize("superadmin", "admin"), async (req, res) => {
  try {
    const users = await User.find({ role: "customer" }).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/customers/:id", verifyToken, authorize("superadmin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Customer not found" });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/customers/:id", verifyToken, authorize("superadmin", "admin", "manager"), async (req, res) => {
  try {
    const { name, email, address } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "Customer not found" });

    if (name) user.name = name;
    if (email) user.email = email;
    if (address) {
      user.address = {
        street: address.street || user.address?.street || "",
        city: address.city || user.address?.city || "",
        state: address.state || user.address?.state || "",
        zip: address.zip || user.address?.zip || "",
      };
    }

    await user.save();

    res.json({ message: "Customer updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
