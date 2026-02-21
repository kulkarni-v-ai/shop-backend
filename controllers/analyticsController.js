import Order from "../models/Order.js";
import Product from "../models/Product.js";

/**
 * @route   GET /api/analytics/stats
 * @desc    Get real-time shop analytics using MongoDB Aggregation
 * @access  Private (Manager, Admin, Superadmin)
 */
export const getStats = async (req, res) => {
    try {
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
            lowStockCount
        ] = await Promise.all([
            // 1. Summary: Total Orders & Revenue
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: "$total" }
                    }
                }
            ]),

            // 2. Orders Chart: Last 7 Days
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: sevenDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 },
                        revenue: { $sum: "$total" }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // 3. Top Selling Products
            Order.aggregate([
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

            // 4. Most Viewed Products
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
            Product.countDocuments({ stock: { $lt: 10 } })
        ]);

        const summary = orderStats[0] || { totalOrders: 0, totalRevenue: 0 };

        // Calculate total views across all products
        const totalViewsResult = await Product.aggregate([
            { $group: { _id: null, totalViews: { $sum: "$views" } } }
        ]);
        const viewsCount = totalViewsResult[0]?.totalViews || 0;

        res.json({
            overview: {
                totalOrders: summary.totalOrders,
                totalRevenue: summary.totalRevenue,
                totalProducts: totalProducts,
                lowStockCount: lowStockCount,
                viewsCount: viewsCount,
                conversionRate: summary.totalOrders > 0 ? ((summary.totalOrders / (viewsCount || 1)) * 100).toFixed(1) : 0
            },
            ordersChart: ordersChart.map(day => ({
                date: day._id,
                orders: day.count,
                revenue: day.revenue
            })),
            topPurchased: topSelling,
            topBrowsed: mostViewed,
            lowStock: lowStockList
        });

    } catch (error) {
        console.error("Real Analytics Error:", error);
        res.status(500).json({ message: "Failed to fetch real-time analytics data" });
    }
};

/**
 * @route   GET /api/analytics/system-overview
 * @desc    Get basic system counts (Superadmin placeholder)
 */
export const getSystemOverview = async (req, res) => {
    // Kept minimal as per previous work, focusing on /stats
    res.json({ message: "System overview stats placeholder" });
};
