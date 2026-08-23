import Order from "../models/orderModel.js";
import User from "../models/userModel.js";

export const getSalesReportService = async (startDate, endDate, page = 1, limit = 10) => {

    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const orders = await Order.find({
        createdAt: {
            $gte: start,
            $lte: end
        },
        paymentStatus: {
            $in: ["Paid", "Pending"]
        }
    }).populate("userId", "name username");

    let totalSales = 0
    let totalOrders = 0
    let couponDiscount = 0
    let offerDiscount = 0

    const sales = [];

    for (const order of orders) {

        const validItems = order.items.filter(item =>
            item.status !== "Cancelled" &&
            item.status !== "Returned"
        )

        if (validItems.length === 0) {
            continue;
        }

        totalOrders++;

        for (const item of validItems) {

            totalSales += item.totalPrice || 0
            offerDiscount += item.offerDiscount || 0

            sales.push({
                username: order.userId?.name || order.userId?.username || "Unknown",
                address: order.address
                    ? `${order.address.city}, ${order.address.state}`
                    : "N/A",
                quantity: item.quantity || 0,
                price: item.regularPrice || 0,
                discounted: item.totalPrice || 0,
                paymentMethod: order.paymentMethod,
                date: order.createdAt
            })
        }

        couponDiscount += order.discount || 0
    }

    const totalSalesRows = sales.length
    const totalPages = Math.ceil(totalSalesRows/limit)
    const currentPage = Math.max(1, Math.min(page, totalPages || 1))
    const skip = (currentPage - 1) * limit
    const paginatedSales = sales.slice(skip, skip + limit)

    return {
        totalSales,
        totalOrders,
        couponDiscount,
        offerDiscount,
        netRevenue: totalSales,

        sales: paginatedSales,

        pagination: {
            currentPage,
            totalPages,
            totalSalesRows,
            hasPrev: currentPage > 1,
            hasNext: currentPage < totalPages
        }
    }
}