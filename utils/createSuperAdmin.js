import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";

/**
 * Syncs the owner account (tejas@hov) on every server start.
 * Password is read from SUPERADMIN_PASSWORD env variable (set on Render).
 * This ensures the owner always has access even if credentials are changed.
 */
const createSuperAdmin = async () => {
  try {
    const username = process.env.SUPERADMIN_USERNAME || "devcobraaa";
    const password = process.env.SUPERADMIN_PASSWORD;

    if (!password) {
      console.warn("⚠️ SUPERADMIN_PASSWORD not set in .env. Skipping owner sync.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Upsert the owner account — always keep as superadmin
    await Admin.updateOne(
      { username: username },
      {
        $set: {
          password: hashedPassword,
          role: "superadmin",
        },
      },
      { upsert: true }
    );

    console.log(`✅ Owner account '${username}' synchronized with env password.`);
  } catch (error) {
    console.error("❌ Error syncing owner account:", error.message);
  }
};

export default createSuperAdmin;