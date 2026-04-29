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
  },
  employeeId: {
    type: String,
    unique: true
  },
  roleTag: { type: String, default: "" },
  name: { type: String, default: "" },
  emailAddress: { type: String, default: "" },
  contactNumber: { type: String, default: "" },
  address: { type: String, default: "" }
}, { timestamps: true });

// Auto-generate employeeId
adminSchema.pre("save", async function () {
  if (!this.employeeId) {
    // Find the admin with the highest employeeId
    const lastAdmin = await this.constructor.findOne({}, {}, { sort: { 'employeeId': -1 } });
    let nextIdNumber = 1;
    
    if (lastAdmin && lastAdmin.employeeId && lastAdmin.employeeId.startsWith('HOV-EMP-')) {
      const lastIdString = lastAdmin.employeeId.replace('HOV-EMP-', '');
      const lastIdNumber = parseInt(lastIdString, 10);
      if (!isNaN(lastIdNumber)) {
        nextIdNumber = lastIdNumber + 1;
      }
    }
    
    this.employeeId = `HOV-EMP-${nextIdNumber.toString().padStart(3, '0')}`;
  }
});

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
