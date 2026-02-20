import User from "../models/Admin.js";
import bcrypt from "bcryptjs";

const createSuperAdmin = async () => {
  try {
    const exists = await User.findOne({
      email: process.env.SUPERADMIN_EMAIL,
    });

    if (exists) {
      console.log("✅ Superadmin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      process.env.SUPERADMIN_PASSWORD,
      10
    );

   await User.updateOne(
  { username: process.env.SUPERADMIN_USERNAME },
  {
    $setOnInsert: {
      name: "Super Admin",
      email: process.env.SUPERADMIN_EMAIL,
      password: hashedPassword,
      role: "superadmin",
    }
  },
  { upsert: true }
);

    console.log("🔥 Superadmin created successfully");
  } catch (error) {
    console.error("❌ Error creating superadmin:", error.message);
  }
};

export default createSuperAdmin;