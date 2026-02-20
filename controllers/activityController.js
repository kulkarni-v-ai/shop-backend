import ActivityLog from "../models/ActivityLog.js";

/**
 * @route   GET /api/admin/system-logs
 * @desc    Get paginated and filtered activity logs
 * @access  Private/Superadmin
 */
export const getLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const query = {};

        // Filtering by actionType
        if (req.query.actionType) {
            query.actionType = req.query.actionType;
        }

        const logs = await ActivityLog.find(query)
            .populate("userId", "username") // Optionally populate username
            .sort({ timestamp: -1 }) // Sorting newest first
            .skip(skip)
            .limit(limit);

        const total = await ActivityLog.countDocuments(query);

        res.json({
            logs,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch system logs" });
    }
};

/**
 * @route   PATCH /api/admin/system-logs/archive/:id
 * @desc    Archive an immutable activity log
 * @access  Private/Superadmin
 */
export const archiveLog = async (req, res) => {
    try {
        const logId = req.params.id;

        const log = await ActivityLog.findById(logId);
        if (!log) {
            return res.status(404).json({ message: "Log not found" });
        }

        // Explicit controller-level check for immutability constraints.
        // Archived status is the *only* field that can ever be modified on an immutable log.
        if (log.immutable) {
            // We only allow setting it to archived. Any other update is blocked.
            log.isArchived = true;
            await log.save();
            return res.json({ message: "Log successfully archived", log });
        }

        res.status(400).json({ message: "Log cannot be modified." });
    } catch (error) {
        res.status(500).json({ message: "Failed to archive log" });
    }
};
