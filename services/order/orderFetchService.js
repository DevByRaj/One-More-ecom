import Order from "../../models/orderModel.js"
import User from "../../models/userModel.js"
import {PAYMENT_STATUS} from "../../constants/orderConstants.js"

export const getUserOrders = async (userId, page = 1, limit = 5) => {

    const skip = (page - 1) * limit

    const filter = {
        userId
    }

    const totalOrders = await Order.countDocuments(filter)

    const orders = await Order.find(filter).sort({createdAt: -1}).skip(skip).limit(limit)

    return {
        orders,
        totalPages: Math.ceil(totalOrders / limit),
        currentPage: page
    }
}

export const getOrderDetailsService = async (userId, orderId) => {

    const order = await Order.findOne({
        _id: orderId,
        userId
    })

    if (!order) {
        return {
            success: false
        }
    }

    return {
        success: true,
        order
    }
}

export const getAllOrders = async (page = 1, limit = 5, search = "", status = "", sort = "newest") => {

    const skip = (page - 1) * limit

    let query = {}

    if (status === PAYMENT_STATUS.FAILED) {
        query.paymentStatus = PAYMENT_STATUS.FAILED
    } else if (status) {
        query.orderStatus = status
    }

    if (search.trim()) {

        const users = await User.find({
            name: {
                $regex: search,
                $options: "i"
            }
        })

        const userIds = users.map(user => user._id)

        query.$or = [
            {
                orderId: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                userId: {
                    $in: userIds
                }
            }
        ]
    }

    let sortOption = {createdAt: -1}

    if (sort === "oldest") {
        sortOption = {createdAt: 1}
    }

    const totalOrders = await Order.countDocuments(query)

    const orders = await Order.find(query).populate("userId").sort(sortOption).skip(skip).limit(limit)

    return {
        orders,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        search
    }
}