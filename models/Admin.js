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
adminSchema.pre("findOneAndDelete", async function (next) {
  const query = this.getQuery();
  const docToUpdate = await this.model.findOne(query);
  if (docToUpdate && docToUpdate.username === "devcobraaa") {
    return next(new Error("Cannot delete the devcobraaa owner account."));
  }
  next();
});

adminSchema.pre("findOneAndUpdate", async function (next) {
  const query = this.getQuery();
  const update = this.getUpdate();

  const docToUpdate = await this.model.findOne(query);

  // Prevent changing devcobraaa's role
  if (docToUpdate && docToUpdate.username === "devcobraaa" && update.role && update.role !== "superadmin") {
    return next(new Error("Cannot demote the devcobraaa owner account."));
  }
  next();
});

export default mongoose.model("Admin", adminSchema);
