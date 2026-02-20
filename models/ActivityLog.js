import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
        },
        role: {
            type: String,
            required: true,
        },
        actionType: {
            type: String,
            required: true,
        },
        targetId: {
            type: String, // ID of resource involved (Product ID, Order ID, etc)
        },
        metadata: {
            type: Object,
            default: {},
        },
        ipAddress: {
            type: String,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        }
    },
    { timestamps: false }
);

// High-performance index for audit trails
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model("ActivityLog", activityLogSchema);
