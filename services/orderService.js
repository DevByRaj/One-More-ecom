import mongoose from "mongoose"
import Address from "../models/addressModel.js"
import Product from "../models/productModel.js"
import Wishlist from "../models/wishlistModel.js"
import {getUserCart, calculateCartTotals} from "./cartService.js"
import Order from "../models/orderModel.js"
import Cart from "../models/cartModel.js"
import Variant from "../models/variantModel.js";
import User from "../models/userModel.js"
import {userInfo} from "os"
import {creditWallet, getOrCreateWallet} from "./walletService.js"
import {FREE_SHIPPING_LIMIT, SHIPPING_CHARGE} from "../config/appConfig.js"
import { calculateBestOffer } from "./offerCalulationService.js"
import { applyCouponService } from "./couponService.js"


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

export const getCheckoutData = async (userId, appliedCoupon = null, buyNow = null) => {

    const addresses = await Address.find({userId})
        .sort({isDefault: -1, createdAt: -1});

    let cart
    if(buyNow){
        
        const product = await Product.findById(buyNow.productId)
        const variant = await Variant.findById(buyNow.variantId)

        if(!product || !product.isListed || 
            !variant || !variant.isListed ||
            variant.stock <= 0
        ){
            return{
                success: false,
                message: "Product unavailabe"
            }
        }
        cart = {
            items:[{
                productId: product,
                variantId: variant,
                quantity: 1
            }]
        }
    } else{
        cart = await getUserCart(userId)

        if(!cart || cart.items.length === 0){
            return {
                success: false
            }
        }
    }

    for(const item of cart.items){
        if(!item.variantId || item.variantId.stock < item.quantity){
            return{
                success: false,
                message: `${item.productId.productName} has only ${item.variantId?.stock || 0} item(s) available`
            }
        }
    }

    let couponDiscount = 0

    if (appliedCoupon?.couponCode) {

        const couponResult = await applyCouponService(
            userId,
            appliedCoupon.couponCode,
            calculateCartTotals(cart).subtotal
        )

        if (couponResult.success) {
            couponDiscount = couponResult.couponDiscount
        }
    }

    const totals = calculateCartTotals(cart, couponDiscount)
    
    const wishlist = await Wishlist.findOne({userId})

    const wishlistCount = wishlist ? wishlist.products.length : 0

    return {
        success: true,
        addresses,
        cart,
        totals,
        wishlistCount
    }

}

const generateOrderId = () => {
    return "ORD" + Date.now()
}

export const placeOrderService = async (userId, orderData, session = null) => {

    const {addressId,
        paymentMethod,
        paymentStatus = "Pending",
        razorpayOrderId = null,
        razorpayPaymentId = null,
        coupon = null,
        buyNow = null } = orderData

    let cart

    if(buyNow){

        const product = await Product.findById(buyNow.productId)
        const variant = await Variant.findById(buyNow.variantId)

        if(!product || !product.isListed ||
            !variant || !variant.isListed
        ){
            return{
                success: false,
                message: "Product unavailable"
            }
        }
        if(variant.stock <= 0){
            return{
                success: false,
                message: "Out of stock"
            }
        }

        cart = {
            items: [{
                productId: product,
                variantId: variant,
                quantity: 1
            }]
        }
    } else{
        cart = await Cart.findOne({userId}).populate("items.productId").populate("items.variantId")

        if(!cart || cart.items.length === 0){
            return{
                success: false,
                message: "Cart is empty"
            }
        }
    }

    const address = await Address.findOne({
        _id: addressId,
        userId
    })

    if (!address) {
        return {
            success: false,
            message: "Address not found"
        }
    }
    for (const item of cart.items) {
        item.offer = await calculateBestOffer(
            item.productId,
            item.variantId
        );
    }

    const couponDiscount = coupon?.discount || 0

    const totals = calculateCartTotals(cart, couponDiscount)

    for (const item of cart.items) {

        if (item.variantId.stock < item.quantity) {
            return {
                success: false,
                message: `${item.productId.productName} has only ${item.variantId.stock} item(s) available`
            }
        }
    }

    const orderItems = await Promise.all(
        cart.items.map(async(item) =>{

            const offer = await calculateBestOffer(
                item.productId, item.variantId
            )

            return{
                productId: item.productId._id,

                variantId: item.variantId._id,
                
                productName: item.productId.productName,

                variantName: item.variantId.variantName,

                productImage: item.variantId.variantImage[0],

                quantity: item.quantity,

                regularPrice: item.variantId.regularPrice,

                salePrice: offer.finalPrice,

                offerDiscount: offer.discountAmount * item.quantity,

                totalPrice: offer.finalPrice * item.quantity,

                status: "Pending"
            }
        })
    )

    const orderDataToCreate = {
        orderId: generateOrderId(),
        userId,
        items: orderItems,
        address: {
            name: address.name,
            houseName: address.houseName,
            street: address.street,
            city: address.city,
            state: address.state,
            country: address.country,
            phone: address.phone,
            pincode: address.pincode
        },
        paymentMethod,
        paymentStatus,
        razorpayOrderId,
        razorpayPaymentId,
        orderStatus: "Pending",
        coupon: coupon
            ? {
                couponId: coupon.couponId,
                couponCode: coupon.couponCode
            }
            : null,
        subTotal: totals.subtotal,
        shipping: totals.shipping,
        discount: totals.discount,
        grandTotal: totals.grandTotal
    }

    const order = await Order.create(
        [orderDataToCreate],
        session ? {session} : undefined
    )

    const createdOrder = order[0]
    

    for (const item of cart.items) {
        await Variant.findByIdAndUpdate(
            item.variantId._id,
            {
                $inc: {
                    stock: -item.quantity
                }
            },
            session ? {session} : undefined
        )
    }

    if(!buyNow){

        cart.items = []
        await cart.save(session?{session}:undefined)

    }
    return {
        success: true,
        orderId: createdOrder._id
    }

}

export const completeRazorpayOrderService = async (
    userId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    buyNow = null
) => {

    const order = await Order.findOne({
        userId,
        razorpayOrderId,
        paymentStatus: "Pending"
    })

    if (!order) {
        return {
            success: false,
            message: "Pending order not found"
        }
    }

    for (const item of order.items) {

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

    for (const item of order.items) {

        await Variant.findByIdAndUpdate(
            item.variantId,
            {
                $inc: {
                    stock: -item.quantity
                }
            }
        )
    }

    order.paymentStatus = "Paid"
    order.razorpayPaymentId = razorpayPaymentId
    order.razorpaySignature = razorpaySignature

    await order.save()

    if (!buyNow) {

        const cart = await Cart.findOne({userId})

        if (cart) {

            const orderedVariantIds = order.items.map(
                item => item.variantId.toString()
            )

            cart.items = cart.items.filter(
                item =>
                    !orderedVariantIds.includes(
                        item.variantId.toString()
                    )
            )

            await cart.save()
        }
    }

    return {
        success: true,
        orderId: order._id
    }
}

export const createPendingOrderService = async (userId, orderData, appliedCoupon = null, buyNow = null) => {

    const {
        addressId,
        paymentMethod,
        razorpayOrderId = null
    } = orderData

    let cart

    if (buyNow) {

        const product = await Product.findById(buyNow.productId)
        const variant = await Variant.findById(buyNow.variantId)

        if (
            !product ||
            !product.isListed ||
            !variant ||
            !variant.isListed
        ) {
            return {
                success: false,
                message: "Product unavailable"
            }
        }

        if (variant.stock <= 0) {
            return {
                success: false,
                message: "Out of stock"
            }
        }

        cart = {
            items: [{
                productId: product,
                variantId: variant,
                quantity: 1
            }]
        }

    } else {

        cart = await Cart.findOne({userId})
            .populate("items.productId")
            .populate("items.variantId")

        if (!cart || cart.items.length === 0) {
            return {
                success: false,
                message: "Cart is empty"
            }
        }
    }

    const address = await Address.findOne({
        _id: addressId,
        userId
    })

    if (!address) {
        return {
            success: false,
            message: "Address not found"
        }
    }

    for (const item of cart.items) {

        item.offer = await calculateBestOffer(
            item.productId,
            item.variantId
        )
    }

    for (const item of cart.items) {

        if (item.variantId.stock < item.quantity) {
            return {
                success: false,
                message: `${item.productId.productName} is out of stock`
            }
        }
    }

    let couponDiscount = 0

    if (appliedCoupon?.couponCode) {

        const couponResult = await applyCouponService(
            userId,
            appliedCoupon.couponCode,
            calculateCartTotals(cart).subtotal
        )

        if (!couponResult.success) {
            return {
                success: false,
                message: couponResult.message
            }
        }

        couponDiscount = couponResult.couponDiscount
    }

    const totals = calculateCartTotals(
        cart,
        couponDiscount
    )

    const orderItems = await Promise.all(
        cart.items.map(async (item) => {

            const offer = await calculateBestOffer(
                item.productId,
                item.variantId
            )

            return {
                productId: item.productId._id,

                variantId: item.variantId._id,

                productName: item.productId.productName,

                variantName: item.variantId.variantName,

                productImage: item.variantId.variantImage[0],

                quantity: item.quantity,

                regularPrice: item.variantId.regularPrice,

                salePrice: offer.finalPrice,

                offerDiscount: offer.discountAmount * item.quantity,

                totalPrice:
                    offer.finalPrice * item.quantity,

                status: "Pending"
            }
        })
    )

    const order = await Order.create({

        orderId: generateOrderId(),

        userId,

        items: orderItems,

        address: {
            name: address.name,
            houseName: address.houseName,
            street: address.street,
            city: address.city,
            state: address.state,
            country: address.country,
            phone: address.phone,
            pincode: address.pincode
        },

        paymentMethod,

        paymentStatus: "Pending",

        razorpayOrderId,

        razorpayPaymentId: null,

        orderStatus: "Pending",

        coupon: appliedCoupon
            ? {
                couponId: appliedCoupon.couponId,
                couponCode: appliedCoupon.couponCode
            }
            : null,

        subTotal: totals.subtotal,

        shipping: totals.shipping,

        discount: totals.discount,

        grandTotal: totals.grandTotal
    })

    return {
        success: true,
        order
    }
}

export const getUserOrders = async (userId, page = 1, limit = 5) => {

    const skip = (page - 1) * limit

    const totalOrders = await Order.countDocuments({userId})

    const orders = await Order.find({userId}).sort({createdAt: -1}).skip(skip).limit(limit)

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

const recalculateOrderTotals = (order) => {

    const activeItems = order.items.filter(
        item => !["Cancelled", "Returned"].includes(item.status)
    )

    const subtotal = activeItems.reduce((total, item) => total + item.totalPrice, 0)

    order.subTotal = subtotal

    order.shipping = subtotal > 0 && subtotal < FREE_SHIPPING_LIMIT ? SHIPPING_CHARGE: 0

    order.discount = Math.min(order.discount || 0, subtotal)

    order.grandTotal =  order.subTotal - order.discount + order.shipping
}

const calculateOverallOrderStatus = (items) => {

    const activeItems = items.filter(item => !["Cancelled", "Returned"].includes(item.status))

    if (items.every(item => item.status === "Cancelled")) {
        return "Cancelled"
    }

    if (activeItems.some(item => item.status === "Return Requested")) {
        return "Return Requested";
    }

    if (items.every(item => item.status === "Returned")) {
        return "Returned"
    }

    if (activeItems.length === 0) {
        return "Delivered"
    }

    if(activeItems.every(item => item.status === "Delivered")){
        return "Delivered"
    }

    if(activeItems.some(item => item.status === "Out For Delivery")){
        return "Out For Delivery"
    }

    if(activeItems.some(item => item.status === "Shipped")){
        return "Shipped"
    }

    if(activeItems.some(item => item.status === "Processing")){
        return "Processing"
    }

    if(activeItems.some(item => item.status === "Pending")){
        return "Pending"
    }

    return "Pending"

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

    order.orderStatus = calculateOverallOrderStatus(order.items)

    const previousGrandTotal = order.grandTotal

    if(order.discount > 0 && order.subTotal > 0){

        const itemDiscount = (item.totalPrice / order.subTotal) * order.discount

        order.discount = Math.max(0, order.discount - itemDiscount)
    }

    recalculateOrderTotals(order)

    order.orderStatus = calculateOverallOrderStatus(order.items)

    if(order.paymentStatus === "Paid"){

        const refundAmount = previousGrandTotal - order.grandTotal

        if(refundAmount > 0){

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

export const getAllOrders = async (page = 1, limit = 5, search = "", status = "", sort = "newest") => {

    const skip = (page - 1) * limit

    let query = {}

    if (status) {
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

    for (const item of order.items) {
        const newStatus = formData[`status_${item._id}`]

        if (!newStatus) continue

        const allowedStatuses = allowedStatusTransitions[item.status]

        if (!allowedStatuses.includes(newStatus)) {
            throw new Error(`Invalid status transaction from ${item.status} to ${newStatus}`)
        }

        if(newStatus === "Delivered" && order.paymentMethod === "COD"){
            order.paymentStatus = "Paid"
        }

        if(item.status === "Return Requested" && newStatus === "Returned"){

            await Variant.findByIdAndUpdate(item.variantId, {
                $inc:{
                    stock: item.quantity
                }
            })

            if (order.paymentStatus === "Paid") {

                const itemDiscount =
                    order.subTotal > 0
                        ? (item.totalPrice / order.subTotal) * order.discount
                        : 0

                let refundAmount = item.totalPrice - itemDiscount

                const remainingActiveItems = order.items.filter(orderItem =>{

                    if(orderItem._id.toString() === item._id.toString()){
                        return false
                    }

                    const status = formData[`status_${orderItem._id}`] || orderItem.status

                    return !["Cancelled", "Returned"].includes(status)
                })

                if(remainingActiveItems.length === 0){
                    refundAmount += order.shipping
                }

                await creditWallet(
                    order.userId,
                    refundAmount,
                    `Refund for returned product - ${item.productName}`,
                    order._id,
                    "Refund"
                )                
                
            }

            item.returnedAt = new Date()
        }
        
        if (
            item.status !== "Cancelled" &&
            newStatus === "Cancelled"
        )  {

            await Variant.findByIdAndUpdate(item.variantId, {
                $inc: {
                    stock: item.quantity
                }
            })

            if (order.paymentStatus === "Paid") {

                let refundAmount = item.totalPrice

                const remainingActiveItems = order.items.filter(orderItem => {
                    if (orderItem._id.toString() === item._id.toString()) {
                        return false;
                    }

                    const status = formData[`status_${orderItem._id}`] || orderItem.status;

                    return !["Cancelled", "Returned"].includes(status);
                })

                if (remainingActiveItems.length === 0) {
                    refundAmount += order.shipping

                }

                await creditWallet(
                    order.userId,
                    refundAmount,
                    `Refund for cancelled product - ${item.productName}`,
                    order._id,
                    "Refund"
                )
            }

            item.cancelledAt = new Date()
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
                paymentMethod: "WALLET",
                paymentStatus: "Paid",
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

        console.log(error)

        return {
            success: false,
            message: "Wallet payment failed"
        }

    } finally {

        await session.endSession()

    }
}