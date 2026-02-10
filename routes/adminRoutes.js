import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";   // ⭐ ADD THIS
import Admin from "../models/Admin.js";

const router = express.Router();

/* ADMIN LOGIN */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: "Invalid username" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    //  CREATE JWT TOKEN (NEW)
    const token = jwt.sign(
      { id: admin._id },
      "secretkey",
      { expiresIn: "7d" }
    );

    //  RETURN TOKEN ALONG WITH EXISTING RESPONSE
    res.json({
      message: "Login successful",
      token,   //  NEW
      admin: {
        id: admin._id,
        username: admin.username
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
