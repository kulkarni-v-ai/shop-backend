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

    // Create devcobraaa owner account
    const result = await db.collection("admins").updateOne(
      { username: "devcobraaa" },
      {
        $set: {
          password: hashedPassword,
          role: "superadmin",
        },
        $setOnInsert: {
          username: "devcobraaa",
          createdAt: new Date(),
        }
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log('✅ Created new owner account "devcobraaa" with password "admin123"');
    } else {
      console.log('✅ Updated "devcobraaa" password to "admin123"');
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

run();
