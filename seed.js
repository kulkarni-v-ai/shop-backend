import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;

        // Convert all existing local admins to 'superadmin' so we can test the new dashboard
        await db.collection("admins").updateMany({}, { $set: { role: "superadmin" } });

        console.log("Superadmin seeded!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
