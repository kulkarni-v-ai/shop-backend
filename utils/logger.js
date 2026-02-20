import ActivityLog from "../models/ActivityLog.js";

/**
 * Robust logging utility to track administrative actions.
 * Designed to fail silently to prevent logger errors from breaking core business logic.
 * 
 * @param {Object} data
 * @param {string} data.userId - The ID of the authenticated admin
 * @param {string} data.role - The role of the caller (e.g., 'superadmin')
 * @param {string} data.actionType - The specific action (e.g., 'UPDATE_PRODUCT')
 * @param {string} [data.targetId] - (Optional) The ID of the item being touched
 * @param {Object} [data.metadata] - (Optional) Key-value pairs for extra context
 * @param {string} [data.ipAddress] - (Optional) Caller's IP address
 */
export const logAction = async ({ userId, role, actionType, targetId, metadata = {}, ipAddress }) => {
    try {
        const logEntry = new ActivityLog({
            userId,
            role,
            actionType,
            targetId,
            metadata,
            ipAddress
        });

        await logEntry.save();
    } catch (error) {
        // Silent failure: do not interrupt the main request flow if logging fails
        console.error("[Logger Error] Critical failure in ActivityLog save:", error.message);
    }
};
