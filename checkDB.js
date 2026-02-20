import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Admin from "./models/Admin.js";

dotenv.config();

const checkOrCreate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        let user = await Admin.findOne({ username: "superadmin" });
        if (!user) {
            console.log("No user named 'superadmin' found. Creating one...");
            const salt = await bcrypt.genSalt(10);
            const password = await bcrypt.hash("superadmin", salt);
            user = await Admin.create({
                username: "superadmin",
                password,
                role: "superadmin"
            });
            console.log("Created user 'superadmin' with password 'superadmin'");
        } else {
            console.log("Found existing user! Try logging in with username:", user.username);
            if (user.role !== "superadmin") {
                user.role = "superadmin";
                await user.save();
                console.log("Upgraded user to superadmin role.");
            }
        }

        const all = await Admin.find({});
        console.log("All existing admins:");
        all.forEach(a => console.log(`- ${a.username} (${a.role})`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkOrCreate();
