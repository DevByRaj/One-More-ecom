import Order from "../models/orderModel.js";

export const getSalesReportService = async (startDate, endDate, page = 1, limit = 10, paginate = true) => {

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

    if (!paginate) {

        return {
            totalSales,
            totalOrders,
            couponDiscount,
            offerDiscount,
            netRevenue: totalSales,

            sales,

            pagination: {
                currentPage: 1,
                totalPages: 1,
                totalSalesRows,
                hasPrev: false,
                hasNext: false
            }
        }
    }

    const totalPages = Math.ceil(totalSalesRows / limit)

    const currentPage = Math.max(
        1,
        Math.min(page, totalPages || 1)
    )

    const skip = (currentPage - 1) * limit

    const paginatedSales = sales.slice(
        skip,
        skip + limit
    )
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

export const getBestSellingProductsService = async (page = 1, limit = 10) => {

    const skip = (page - 1) * limit

    const bestSellingProducts = await Order.aggregate([

        {
            $unwind: "$items"
        },

        {
            $match: {
                "items.status": "Delivered"
            }
        },

        {
            $group: {
                _id: "$items.productId",

                productName: {
                    $first: "$items.productName"
                },

                totalQuantitySold: {
                    $sum: "$items.quantity"
                },

                totalRevenue: {
                    $sum: "$items.totalPrice"
                }
            }
        },

        {
            $sort: {
                totalQuantitySold: -1
            }
        },

        {
            $skip: skip
        },

        {
            $limit: limit
        }

    ])

    const totalResult = await Order.aggregate([

        {
            $unwind: "$items"
        },

        {
            $match: {
                "items.status": "Delivered"
            }
        },

        {
            $group: {
                _id: "$items.productId"
            }
        },

        {
            $count: "total"
        }

    ])

    const totalProducts = totalResult[0]?.total || 0

    const totalPages = Math.ceil(totalProducts / limit)

    return {
        products: bestSellingProducts,
        currentPage: page,
        totalPages
    }
}

export const getBestSellingCategoriesService = async (page = 1, limit = 10) => {

    const skip = (page - 1) * limit

    const bestSellingCategories = await Order.aggregate([

        {
            $unwind: "$items"
        },

        {
            $match: {
                "items.status": "Delivered"
            }
        },

        {
            $lookup: {
                from: "products",
                localField: "items.productId",
                foreignField: "_id",
                as: "product"
            }
        },

        {
            $unwind: "$product"
        },

        {
            $lookup: {
                from: "categories",
                localField: "product.category",
                foreignField: "_id",
                as: "category"
            }
        },

        {
            $unwind: "$category"
        },

        {
            $group: {
                _id: "$category._id",

                categoryName: {
                    $first: "$category.name"
                },

                totalQuantitySold: {
                    $sum: "$items.quantity"
                },

                totalRevenue: {
                    $sum: "$items.totalPrice"
                }
            }
        },

        {
            $sort: {
                totalQuantitySold: -1
            }
        },

        {
            $skip: skip
        },

        {
            $limit: limit
        }

    ])

    const totalResult = await Order.aggregate([

        {
            $unwind: "$items"
        },

        {
            $match: {
                "items.status": "Delivered"
            }
        },

        {
            $lookup: {
                from: "products",
                localField: "items.productId",
                foreignField: "_id",
                as: "product"
            }
        },

        {
            $unwind: "$product"
        },

        {
            $group: {
                _id: "$product.category"
            }
        },

        {
            $count: "total"
        }

    ])

    const totalCategories = totalResult[0]?.total || 0

    const totalPages = Math.ceil(totalCategories / limit)

    return {
        categories: bestSellingCategories,
        currentPage: page,
        totalPages
    }
}

export const getBestSellingBrandsService = async (page = 1, limit = 10) => {

    const skip = (page - 1) * limit

    const bestSellingBrands = await Order.aggregate([

        {
            $unwind: "$items"
        },

        {
            $match: {
                "items.status": "Delivered"
            }
        },

        {
            $lookup: {
                from: "products",
                localField: "items.productId",
                foreignField: "_id",
                as: "product"
            }
        },

        {
            $unwind: "$product"
        },

        {
            $lookup: {
                from: "brands",
                localField: "product.brand",
                foreignField: "_id",
                as: "brand"
            }
        },

        {
            $unwind: "$brand"
        },

        {
            $group: {
                _id: "$brand._id",

                brandName: {
                    $first: "$brand.name"
                },

                totalQuantitySold: {
                    $sum: "$items.quantity"
                },

                totalRevenue: {
                    $sum: "$items.totalPrice"
                }
            }
        },

        {
            $sort: {
                totalQuantitySold: -1
            }
        },

        {
            $skip: skip
        },

        {
            $limit: limit
        }

    ])

    const totalResult = await Order.aggregate([

        {
            $unwind: "$items"
        },

        {
            $match: {
                "items.status": "Delivered"
            }
        },

        {
            $lookup: {
                from: "products",
                localField: "items.productId",
                foreignField: "_id",
                as: "product"
            }
        },

        {
            $unwind: "$product"
        },

        {
            $group: {
                _id: "$product.brand"
            }
        },

        {
            $count: "total"
        }

    ])


    const totalBrands = totalResult[0]?.total || 0

    const totalPages = Math.ceil(totalBrands / limit)


    return {
        brands: bestSellingBrands,
        currentPage: page,
        totalPages
    }
}
