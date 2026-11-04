import logger from "../utils/logger.js";
import mongoose from "mongoose"
import Order from "../models/orderModel.js"
import Cart from "../models/cartModel.js"
import Variant from "../models/variantModel.js";
import {creditWallet, getOrCreateWallet} from "./walletService.js"
import Coupon from "../models/couponModel.js"
import {
    PAYMENT_STATUS,
    PAYMENT_METHOD
} from "../constants/orderConstants.js"
import {
    recalculateOrderTotals,
    calculateOverallOrderStatus
} from "./order/orderCalculationService.js"
import {
    getUserOrders,
    getOrderDetailsService,
    getAllOrders
} from "./order/orderFetchService.js"
import {getCheckoutData} from "./order/checkoutService.js"
import {
    placeOrderService,
    createPendingOrderService
} from "./order/orderCreationService.js"

export {
    getUserOrders,
    getOrderDetailsService,
    getAllOrders, getCheckoutData,
    placeOrderService, createPendingOrderService
}


export const allowedStatusTransitions = {
    Pending: [
        "Pending",
        "Processing",
        "Cancelled"
    ],

    Processing: [
        "Processing",
        "Shipped",
        "Cancelled"
    ],

    Shipped: [
        "Shipped",
        "Out For Delivery",
        "Cancelled"
    ],

    "Out For Delivery": [
        "Out For Delivery",
        "Delivered"
    ],

    Delivered: [
        "Delivered"
    ],

    "Return Requested": [
        "Return Requested",
        "Returned"
    ],

    Returned: [
        "Returned"
    ],

    Cancelled: [
        "Cancelled"
    ]
}

export const getOrderStatusInfo = (order) => {
    if (
        order.paymentMethod === PAYMENT_METHOD.RAZORPAY &&
        order.paymentStatus !== PAYMENT_STATUS.PAID
    ) {
        if (order.paymentStatus === PAYMENT_STATUS.FAILED) {
            return {
                title: "Payment failed",
                message: "Your payment failed. Please retry payment.",
                dot: "cancelled",
                date: order.updatedAt
            };
        }

        return {
            title: "Payment pending",
            message: "Your payment is not completed. Please complete your payment.",
            dot: "expected",
            date: order.createdAt
        };
    }

    switch (order.orderStatus) {
        case "Pending":
            return {
                title: "Order placed",
                message: "Your order has been placed.",
                dot: "expected",
                date: order.createdAt
            }

        case "Processing":
            return {
                title: "Processing",
                message: "Your order is being processed.",
                dot: "expected",
                date: order.updatedAt
            }

        case "Shipped":
            return {
                title: "Shipped",
                message: "Your order has been shipped.",
                dot: "expected",
                date: order.updatedAt
            }

        case "Out For Delivery":
            return {
                title: "Out For Delivery",
                message: "Your order is out for delivery.",
                dot: "expected",
                date: order.updatedAt
            }

        case "Delivered":
            return {
                title: "Delivered",
                message: "Your order has been delivered.",
                dot: "delivered",
                date: order.updatedAt
            }

        case "Cancelled":
            return {
                title: "Cancelled",
                message: "Your order has been cancelled.",
                dot: "cancelled",
                date: order.updatedAt
            }

        case "Return Requested":
            return {
                title: "Return Requested",
                message: "Your return request is under review.",
                dot: "expected",
                date: order.updatedAt
            }

        case "Returned":
            return {
                title: "Returned",
                message: "Your order has been returned successfully.",
                dot: "delivered",
                date: order.updatedAt
            }

        default:
            return {
                title: order.orderStatus,
                message: "",
                dot: "expected",
                date: order.updatedAt
            }
    }
}

export const completeRazorpayOrderService = async (
    userId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    addressId,
    appliedCoupon = null,
    buyNow = null
) => {
    try {

        const alreadyPaidOrder = await Order.findOne({
            userId,
            razorpayOrderId,
            paymentStatus: PAYMENT_STATUS.PAID
        })

        if (alreadyPaidOrder) {
            return {
                success: true,
                orderId: alreadyPaidOrder._id
            }
        }

        const pendingOrder = await Order.findOne({
            userId,
            razorpayOrderId,
            paymentStatus: PAYMENT_STATUS.PENDING
        })

        if (pendingOrder) {

            for (const item of pendingOrder.items) {

                const variant = await Variant.findById(item.variantId)

                if (!variant || !variant.isListed) {
                    return {
                        success: false,
                        message: `${item.productName} is no longer available`
                    }
                }

                if (variant.stock < item.quantity) {
                    return {
                        success: false,
                        message: `${item.productName} is out of stock`
                    }
                }
            }

            if (pendingOrder.coupon?.couponId && !pendingOrder.coupon?.usageCounted) {
                const updatedCoupon = await Coupon.findOneAndUpdate(
                    {
                        _id: pendingOrder.coupon.couponId,
                        $or: [
                            {usageLimit: null},
                            {
                                $expr: {
                                    $lt: ["$usedCount", "$usageLimit"]
                                }
                            }
                        ]
                    },
                    {
                        $inc: {
                            usedCount: 1
                        }
                    }
                )

                if (!updatedCoupon) {
                    return {
                        success: false,
                        message: "Coupon usage limit reached"
                    }
                }

                pendingOrder.coupon.usageCounted = true
            }

            for (const item of pendingOrder.items) {

                await Variant.findByIdAndUpdate(
                    item.variantId,
                    {
                        $inc: {
                            stock: -item.quantity
                        }
                    }
                )
            }

            pendingOrder.paymentStatus = PAYMENT_STATUS.PAID
            pendingOrder.razorpayPaymentId = razorpayPaymentId
            pendingOrder.razorpaySignature = razorpaySignature

            await pendingOrder.save()

            if (!buyNow) {
                const cart = await Cart.findOne({userId})

                if (cart) {
                    const orderedVariantIds = pendingOrder.items.map(
                        item => item.variantId.toString()
                    )

                    cart.items = cart.items.filter(
                        item => !orderedVariantIds.includes(item.variantId.toString())
                    )

                    await cart.save()
                }
            }

            return {
                success: true,
                orderId: pendingOrder._id
            }
        }

        const result = await placeOrderService(
            userId,
            {
                addressId,
                paymentMethod: PAYMENT_METHOD.RAZORPAY,
                paymentStatus: PAYMENT_STATUS.PAID,
                razorpayOrderId,
                razorpayPaymentId,
                coupon: appliedCoupon,
                buyNow
            }
        )

        if (!result.success) {
            return result
        }

        return {
            success: true,
            orderId: result.orderId
        }

    } catch (error) {
        logger.error("Failed to complete Razorpay order", {
            message: error.message,
            stack: error.stack
        })

        return {
            success: false,
            message: "Unable to complete Razorpay order"
        }
    }
}

export const cancelOrderItemService = async (userId, orderId, itemId, cancelReason) => {

    const order = await Order.findOne({
        _id: orderId,
        userId
    })

    if (!order) {
        return {
            success: false,
            message: "Order not Found"
        }
    }

    const item = order.items.id(itemId)

    if (!item) {
        return {
            success: false,
            message: "Product not found"
        }
    }

    if (item.status === "Cancelled") {
        return {
            success: false,
            message: "Product is already cancelled"
        }
    }

    if (item.status === "Shipped" ||
        item.status === "Out For Delivery" ||
        item.status === "Delivered"
    ) {
        return {
            success: false,
            message: "This product can no longer be cancelled"
        }
    }

    await Variant.findByIdAndUpdate(item.variantId, {
        $inc: {
            stock: item.quantity
        }
    })

    item.status = "Cancelled"

    item.cancelledAt = new Date()

    item.cancelReason = cancelReason

    const previousGrandTotal = order.grandTotal

    order.orderStatus = calculateOverallOrderStatus(order.items)

    await recalculateOrderTotals(order)

    order.orderStatus = calculateOverallOrderStatus(order.items)

    if (order.paymentStatus === PAYMENT_STATUS.PAID) {

        const refundAmount = previousGrandTotal - order.grandTotal

        if (refundAmount > 0) {

            await creditWallet(
                order.userId,
                refundAmount,
                `Refund for cancelled product - ${item.productName}`,
                order._id,
                "Refund"
            )
        }
    }

    await order.save()

    return {
        success: true
    }
}

export const getAdminOrderDetails = async (orderId) => {

    const order = await Order.findById(orderId).populate("userId")

    if (!order) {
        return {
            success: false
        }
    }

    return {
        success: true,
        order,
        allowedStatusTransitions
    }
}

export const updateOrderItemStatusService = async (orderId, formData) => {

    const order = await Order.findById(orderId)

    if (!order) {
        throw new Error("Order not found")
    }

    if (
        order.paymentMethod === PAYMENT_METHOD.RAZORPAY &&
        order.paymentStatus !== PAYMENT_STATUS.PAID
    ) {
        throw new Error(
            "Cannot update order status until payment is completed"
        );
    }

    for (const item of order.items) {
        const newStatus = formData[`status_${item._id}`]

        if (!newStatus) continue

        const allowedStatuses = allowedStatusTransitions[item.status]

        if (!allowedStatuses.includes(newStatus)) {
            throw new Error(`Invalid status transaction from ${item.status} to ${newStatus}`)
        }

        if (newStatus === "Delivered" && order.paymentMethod === PAYMENT_METHOD.COD) {
            order.paymentStatus = PAYMENT_STATUS.PAID
        }

        // if (item.status === "Return Requested" && newStatus === "Returned") {

        //     await Variant.findByIdAndUpdate(item.variantId, {
        //         $inc: {
        //             stock: item.quantity
        //         }
        //     })

        //     if (order.paymentStatus === PAYMENT_STATUS.PAID) {

        //         const itemDiscount =
        //             order.subTotal > 0
        //                 ? (item.totalPrice / order.subTotal) * order.discount
        //                 : 0

        //         let refundAmount = item.totalPrice - itemDiscount

        //         const remainingActiveItems = order.items.filter(orderItem => {

        //             if (orderItem._id.toString() === item._id.toString()) {
        //                 return false
        //             }

        //             const status = formData[`status_${orderItem._id}`] || orderItem.status

        //             return !["Cancelled", "Returned"].includes(status)
        //         })

        //         if (remainingActiveItems.length === 0) {
        //             refundAmount += order.shipping
        //         }

        //         await creditWallet(
        //             order.userId,
        //             refundAmount,
        //             `Refund for returned product - ${item.productName}`,
        //             order._id,
        //             "Refund"
        //         )

        //     }

        //     item.returnedAt = new Date()
        // }

        if (item.status === "Return Requested" && newStatus === "Returned") {

            await Variant.findByIdAndUpdate(item.variantId, {
                $inc: {
                    stock: item.quantity
                }
            })

            item.status = newStatus
            item.returnedAt = new Date()

            const previousGrandTotal = order.grandTotal

            await recalculateOrderTotals(order)

            if (order.paymentStatus === PAYMENT_STATUS.PAID) {

                const refundAmount = previousGrandTotal - order.grandTotal

                if (refundAmount > 0) {

                    await creditWallet(
                        order.userId,
                        refundAmount,
                        `Refund for returned product - ${item.productName}`,
                        order._id,
                        "Refund"
                    )
                }
            }

            continue
        }

        if (
            item.status !== "Cancelled" &&
            newStatus === "Cancelled"
        ) {

            await Variant.findByIdAndUpdate(item.variantId, {
                $inc: {
                    stock: item.quantity
                }
            })

            const previousGrandTotal = order.grandTotal

            item.status = newStatus
            item.cancelledAt = new Date()

            await recalculateOrderTotals(order)

            if (order.paymentStatus === PAYMENT_STATUS.PAID) {

                const refundAmount = previousGrandTotal - order.grandTotal

                if (refundAmount > 0) {

                    await creditWallet(
                        order.userId,
                        refundAmount,
                        `Refund for cancelled product - ${item.productName}`,
                        order._id,
                        "Refund"
                    )
                }
            }

            continue
        }

        item.status = newStatus
    }

    order.orderStatus = calculateOverallOrderStatus(order.items)

    await order.save()

    return order
}

export const returnOrderItemService = async (userId, orderId, itemId, returnReason) => {

    const order = await Order.findOne({
        _id: orderId, userId
    })

    if (!order) {
        return {
            success: false,
            message: "Order not Found"
        }
    }

    const item = order.items.id(itemId)

    if (!item) {
        return {
            success: false,
            message: "Product not found"
        }
    }

    if (item.status !== "Delivered") {
        return {
            success: false,
            message: "Only delivered Product can be Returned"
        }
    }

    item.status = "Return Requested"
    item.returnReason = returnReason
    item.returnedAt = new Date()

    order.orderStatus = calculateOverallOrderStatus(order.items)

    await order.save()

    return {
        success: true
    }

}

export const payWithWalletService = async (
    userId,
    orderData,
    appliedCoupon = null,
    buyNow = null
) => {

    const session = await mongoose.startSession()

    try {

        session.startTransaction()

        const checkout = await getCheckoutData(
            userId,
            appliedCoupon,
            buyNow
        )

        if (!checkout.success) {
            await session.abortTransaction()

            return {
                success: false,
                message: checkout.message || "Cart is empty"
            }
        }

        for (const item of checkout.cart.items) {

            if (item.variantId.stock < item.quantity) {

                await session.abortTransaction()

                return {
                    success: false,
                    message: `${item.productId.productName} is out of stock`
                }
            }
        }

        const wallet = await getOrCreateWallet(userId, session)

        if (wallet.balance < checkout.totals.grandTotal) {

            await session.abortTransaction()

            return {
                success: false,
                message: "Insufficient wallet balance"
            }
        }

        const result = await placeOrderService(
            userId,
            {
                ...orderData,
                paymentMethod: PAYMENT_METHOD.WALLET,
                paymentStatus: PAYMENT_STATUS.PAID,
                coupon: appliedCoupon,
                buyNow
            },
            session
        )

        if (!result.success) {

            await session.abortTransaction()

            return result
        }

        wallet.balance -= checkout.totals.grandTotal

        wallet.transactions.unshift({
            type: "Debit",
            amount: checkout.totals.grandTotal,
            description: "Wallet payment",
            orderId: result.orderId
        })

        await wallet.save({session})

        await session.commitTransaction()

        return result

    } catch (error) {

        await session.abortTransaction()

        logger.error("Wallet payment failed", {
            message: error.message,
            stack: error.stack
        })

        return {
            success: false,
            message: "Wallet payment failed"
        }

    } finally {

        await session.endSession()

    }
}