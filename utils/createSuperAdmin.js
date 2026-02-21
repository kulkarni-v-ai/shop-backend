import User from "../models/Admin.js";
import bcrypt from "bcryptjs";

const createSuperAdmin = async () => {
  try {
    const username = process.env.SUPERADMIN_USERNAME || "superadmin";
    const email = process.env.SUPERADMIN_EMAIL || "superadmin@hovshop.com";
    const password = process.env.SUPERADMIN_PASSWORD;

    if (!password) {
      console.warn("⚠️ SUPERADMIN_PASSWORD not set in .env. Skipping sync.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Query by username to avoid duplicate key errors
    await User.updateOne(
      { username: username },
      {
        $set: {
          email: email,
          password: hashedPassword,
          name: "Super Admin",
          role: "superadmin", // Ensure they have the correct role
        },
      },
      { upsert: true }
    );

    console.log("✅ Superadmin credentials synchronized with .env");
  } catch (error) {
    console.error("❌ Error syncing superadmin:", error.message);
  }
};

export default createSuperAdmin;