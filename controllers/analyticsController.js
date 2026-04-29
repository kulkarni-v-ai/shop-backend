import Order from "../models/Order.js";
import Product from "../models/Product.js";

/**
 * @route   GET /api/analytics/stats?range=week|month|year|lifetime
 * @desc    Get real-time shop analytics with optional time range filter
 * @access  Private (Manager, Admin, Superadmin)
 */
export const getStats = async (req, res) => {
    try {
        const { range = "lifetime" } = req.query;

        // Build date filter based on range
        let dateFilter = {};
        if (range !== "lifetime") {
            const since = new Date();
            since.setHours(0, 0, 0, 0);
            if (range === "week")  since.setDate(since.getDate() - 7);
            if (range === "month") since.setMonth(since.getMonth() - 1);
            if (range === "year")  since.setFullYear(since.getFullYear() - 1);
            dateFilter = { createdAt: { $gte: since } };
        }

        // Chart period — last 7 days always shown for the trend line
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const [
            orderStats,
            ordersChart,
            topSelling,
            mostViewed,
            lowStockList,
            totalProducts,
            lowStockCount,
            totalViewsAgg
        ] = await Promise.all([
            // 1. Summary: Total Orders & Revenue (scoped to range)
            Order.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: "$total" }
                    }
                }
            ]),

            // 2. Orders Chart: Last 7 days (always)
            Order.aggregate([
                { $match: { createdAt: { $gte: sevenDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 },
                        revenue: { $sum: "$total" }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // 3. Top Selling Products (scoped to range)
            Order.aggregate([
                { $match: dateFilter },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.name",
                        totalSold: { $sum: "$items.qty" },
                        revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } }
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: 8 }
            ]),

            // 4. Most Viewed Products (not time-scoped — views are cumulative)
            Product.find()
                .sort({ views: -1 })
                .limit(8)
                .select("name views price stock"),

            // 5. Low Stock List (stock < 10)
            Product.find({ stock: { $lt: 10 } })
                .sort({ stock: 1 })
                .select("name stock price"),

            // 6. Total Products Count
            Product.countDocuments(),

            // 7. Low Stock Count
            Product.countDocuments({ stock: { $lt: 10 } }),

            // 8. Total Views Count
            Product.aggregate([
                { $group: { _id: null, totalViews: { $sum: "$views" } } }
            ])
        ]);

        const summary = orderStats[0] || { totalOrders: 0, totalRevenue: 0 };
        const totalViewsCount = totalViewsAgg[0]?.totalViews || 0;

        res.json({
            range,
            summary: {
                totalOrders: summary.totalOrders,
                totalRevenue: summary.totalRevenue,
                totalProducts,
                lowStockCount,
                viewsCount: totalViewsCount
            },
            ordersChart: ordersChart.map(day => ({
                date: day._id,
                orders: day.count,
                revenue: day.revenue
            })),
            topProducts: {
                selling: topSelling,
                viewed: mostViewed
            },
            lowStock: lowStockList
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: "Failed to fetch analytics data" });
    }
};

/**
 * @route   GET /api/analytics/system-overview
 * @desc    Get basic system counts (Superadmin)
 */
export const getSystemOverview = async (req, res) => {
    res.json({ message: "System overview stats placeholder" });
};
