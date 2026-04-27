import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const result = await db.collection("admins").updateMany(
      {},
      { $set: { password: hashedPassword } }
    );

    console.log(`✅ Reset password for ${result.modifiedCount} admin accounts to "admin123"`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

run();
