import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  username: String,
  password: String, // hashed
});

export default mongoose.model("Admin", adminSchema);
