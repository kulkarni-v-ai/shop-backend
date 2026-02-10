
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Admin from "./models/Admin.js";


dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // hash password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // delete old admin (if exists)
    await Admin.deleteMany({});

    // create new admin
    await Admin.create({
      username: "admin",
      password: hashedPassword,
    });

    console.log("Admin created successfully");
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

createAdmin();
