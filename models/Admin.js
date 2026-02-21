import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  }, // hashed
  role: {
    type: String,
    enum: ["superadmin", "admin", "manager"],
    default: "manager",
  }
}, { timestamps: true });

// Protect the developer-controlled superadmin
adminSchema.pre("findOneAndDelete", async function () {
  const query = this.getQuery();
  const docToUpdate = await this.model.findOne(query);
  if (docToUpdate && docToUpdate.role === "superadmin") {
    throw new Error("Cannot delete a superadmin account.");
  }
});

adminSchema.pre("findOneAndUpdate", async function () {
  const query = this.getQuery();
  const update = this.getUpdate();

  const docToUpdate = await this.model.findOne(query);

  // Prevent changing a superadmin's role to something else
  if (docToUpdate && docToUpdate.role === "superadmin" && update.role && update.role !== "superadmin") {
    throw new Error("Cannot demote a superadmin account.");
  }
});

export default mongoose.model("Admin", adminSchema);
