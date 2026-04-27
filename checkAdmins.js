import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const admins = await db.collection("admins").find({}).project({ username: 1, role: 1, name: 1, email: 1, _id: 1 }).toArray();
    console.log("\n=== Admin accounts in MongoDB Atlas ===\n");
    if (admins.length === 0) {
      console.log("No admin accounts found!");
    } else {
      admins.forEach((a, i) => {
        console.log(`${i + 1}. Username: ${a.username || "N/A"}`);
        console.log(`   Role: ${a.role || "N/A"}`);
        console.log(`   Name: ${a.name || "N/A"}`);
        console.log(`   Email: ${a.email || "N/A"}`);
        console.log(`   ID: ${a._id}`);
        console.log("");
      });
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

run();
