import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import verifyToken, { authorize } from "../middleware/auth.js";

const router = express.Router();

// Helper to create JWT
const createToken = (id, role = "customer") => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
};

// @route   POST /api/auth/register
// @desc    Register a new user
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({
            name,
            email,
            password,
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: createToken(user._id, user.role),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/login
// @desc    Auth user & get token
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Try user first
        const user = await User.findOne({ email });
        if (user && (await user.comparePassword(password))) {
            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: createToken(user._id, user.role),
            });
        }

        // If no user, try admin (email field acts as username)
        const Admin = (await import("../models/Admin.js")).default;
        const bcrypt = (await import("bcryptjs")).default;
        const admin = await Admin.findOne({ username: email });
        
        if (admin && (await bcrypt.compare(password, admin.password))) {
            return res.json({
                _id: admin._id,
                username: admin.username,
                role: admin.role,
                token: createToken(admin._id, admin.role),
            });
        }

        res.status(401).json({ message: "Invalid credentials" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/google
// @desc    Google OAuth Login/Register
router.post("/google", async (req, res) => {
    try {
        const { name, email, googleId, avatar } = req.body;

        let user = await User.findOne({ email });

        if (user) {
            // Update googleId if not present
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // Create new user for OAuth
            user = await User.create({
                name,
                email,
                googleId,
                avatar,
            });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            token: createToken(user._id, user.role),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile (Name & Password)

router.put("/profile", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.admin.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const { name, password, address } = req.body;
        if (name) user.name = name;
        if (password) user.password = password;
        if (address) {
            user.address = {
                street: address.street || user.address?.street || "",
                city: address.city || user.address?.city || "",
                state: address.state || user.address?.state || "",
                zip: address.zip || user.address?.zip || "",
            };
        }

        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            address: user.address,
            message: "Profile updated successfully"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Generate reset token and send email
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "There is no user with that email" });
        }

        // Generate token
        const resetToken = crypto.randomBytes(20).toString("hex");

        // Hash token and set to resetPasswordToken field
        user.resetPasswordToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // Set expire (15 minutes)
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

        await user.save();

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log("-----------------------------------------");
            console.log(`PASSWORD RESET REQUESTED FOR: ${email}`);
            console.log(`RESET TOKEN: ${resetToken}`);
            console.log("-----------------------------------------");
            return res.status(200).json({ message: "Email sent (Simulated in console)" });
        }

        // Create reset url
        const resetUrl = `${process.env.FRONTEND_URL || "https://houseofvisuals.co.in"}/reset-password/${resetToken}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request - House of Visuals',
            text: `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Email sent" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Email could not be sent" });
    }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password using token
router.post("/reset-password/:token", async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash("sha256")
            .update(req.params.token)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
