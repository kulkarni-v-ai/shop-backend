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
      { id: admin._id, role: admin.role, username: admin.username },
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
      id: savedAdmin._id,
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
    if (adminToDelete.username === "devcobraaa") {
      return res.status(403).json({ message: "Cannot delete the devcobraaa owner account" });
    }
    if (adminToDelete.role === "superadmin" && req.admin.username !== "devcobraaa") {
      return res.status(403).json({ message: "Only devcobraaa can delete other superadmin accounts" });
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

/* SUPERADMIN ONLY: UPDATE USER (Role, Username, Password) */
router.put("/users/:id", verifyToken, authorize("superadmin"), async (req, res) => {
  try {
    const { role, username, password } = req.body;
    if (role && !["superadmin", "admin", "manager"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Explicit controller-level validation
    const adminToUpdate = await Admin.findById(req.params.id);
    if (!adminToUpdate) {
      return res.status(404).json({ message: "Admin not found" });
    }
    if (adminToUpdate.username === "devcobraaa") {
      return res.status(403).json({ message: "Cannot modify the role of the devcobraaa owner account" });
    }
    if (adminToUpdate.role === "superadmin" && req.admin.username !== "devcobraaa") {
      return res.status(403).json({ message: "Only devcobraaa can modify superadmin accounts" });
    }

    if (role) adminToUpdate.role = role;
    if (username) adminToUpdate.username = username;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      adminToUpdate.password = await bcrypt.hash(password, salt);
    }
    
    await adminToUpdate.save();

    await logAction({
      userId: req.admin.id,
      role: req.admin.role,
      actionType: "UPDATE_ADMIN",
      targetId: req.params.id,
      metadata: { newRole: role, newUsername: username },
      ipAddress: req.ip
    });

    res.json({ message: "User updated successfully", admin: adminToUpdate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* UPDATE SELF PROFILE */
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { username, password } = req.body;
    const adminToUpdate = await Admin.findById(req.admin.id);
    
    if (!adminToUpdate) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (username) adminToUpdate.username = username;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      adminToUpdate.password = await bcrypt.hash(password, salt);
    }

    await adminToUpdate.save();

    res.json({ message: "Profile updated successfully", admin: adminToUpdate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================================
   CUSTOMER MANAGEMENT
   ========================================= */

/* GET ALL CUSTOMERS */
router.get("/customers", verifyToken, authorize("superadmin", "admin", "manager"), async (req, res) => {
  try {
    const customers = await User.find().select("-password");
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* UPDATE CUSTOMER */
router.put("/customers/:id", verifyToken, authorize("superadmin", "admin"), async (req, res) => {
  try {
    const { name, email, address } = req.body;
    const customerToUpdate = await User.findById(req.params.id);
    
    if (!customerToUpdate) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (name) customerToUpdate.name = name;
    if (email) customerToUpdate.email = email;
    if (address) customerToUpdate.address = address;

    await customerToUpdate.save();

    await logAction({
      userId: req.admin.id,
      role: req.admin.role,
      actionType: "UPDATE_CUSTOMER",
      targetId: req.params.id,
      ipAddress: req.ip
    });

    res.json({ message: "Customer updated successfully", customer: customerToUpdate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* DELETE CUSTOMER */
router.delete("/customers/:id", verifyToken, authorize("superadmin", "admin"), async (req, res) => {
  try {
    const customerToDelete = await User.findById(req.params.id);
    if (!customerToDelete) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await User.findByIdAndDelete(req.params.id);

    await logAction({
      userId: req.admin.id,
      role: req.admin.role,
      actionType: "DELETE_CUSTOMER",
      targetId: req.params.id,
      ipAddress: req.ip
    });

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ADMIN ANALYTICS: Exposed at /api/admin/stats */
router.get("/stats", verifyToken, authorize("superadmin", "admin", "manager"), getStats);

export default router;
