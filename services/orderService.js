import Address from "../models/addressModel.js"
import Wishlist from "../models/wishlistModel.js"
import {getUserCart, calculateCartTotals} from "./cartService.js"
import Order from "../models/orderModel.js"
import Cart from "../models/cartModel.js"
import Variant from "../models/variantModel.js";

export const getCheckoutData = async (userId) => {

    const addresses = await Address.find({userId})
        .sort({isDefault: -1, createdAt: -1});

    const cart = await getUserCart(userId)

    if (!cart || cart.items.length === 0) {
        return {
            success: false
        }
    }

    const totals = calculateCartTotals(cart)

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

export const placeOrderService = async (userId, orderData) => {

    const {addressId, paymentMethod} = orderData

    const cart = await Cart.findOne({userId}).populate("items.productId").populate("items.variantId")

    if (!cart || cart.items.length === 0) {
        return {
            success: false,
            message: "Cart is empty"
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

    const totals = calculateCartTotals(cart)

    for (const item of cart.items) {

        if (item.variantId.stock < item.quantity) {
            return {
                success: false,
                message: `${item.productId.productName} is out of stock`
            }
        }
    }

    const orderItems = cart.items.map(item => ({

        productId: item.productId._id,

        variantId: item.variantId._id,

        productName: item.productId.productName,

        variantName: item.variantId.variantName,

        productImage: item.variantId.variantImage[0],

        quantity: item.quantity,

        regularPrice: item.variantId.regularPrice,

        salePrice: item.variantId.salePrice,

        totalPrice: item.variantId.salePrice * item.quantity,

        status: "Pending"

    }))

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
        orderStatus: "Pending",
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        discount: totals.discount,
        grandTotal: totals.grandTotal


    })

    for (const item of cart.items) {
        await Variant.findByIdAndUpdate(
            item.variantId._id,
            {
                $inc: {
                    stock: -item.quantity
                }
            }
        )
    }

    cart.items = []

    await cart.save()

    return {
        success: true,
        orderId: order._id
    }

}

export const getUserOrders = async (userId) => {

    const orders = await Order.find({userId}).sort({createdAt: -1})

    return orders
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

const recalculateOrderTotals = (order)=>{

    const activeItems = order.items.filter(item => item.status !== "Cancelled")

    const subtotal = activeItems.reduce((total, item) => total + item.totalPrice, 0)

    let discount = 0

    const shipping = subtotal >= 1000 || subtotal === 0?0:50

    const grandTotal = subtotal - discount + shipping

    order.subtotal = subtotal
    order.discount = discount
    order.shipping = shipping
    order.grandTotal = grandTotal
}

export const cancelOrderItemService = async(userId, orderId, itemId, cancelReason) =>{

    const order = await Order.findOne({
        _id: orderId,
        userId
    })

    if(!order){
        return{
            success: false,
            message: "Order not Found"
        }
    }

    const item = order.items.id(itemId)

    if(!item){
        return{
            success: false,
            message: "Product not found"
        }
    }

    if(item.status === "Cancelled"){
        return{
            success: false,
            message: "Product is already cancelled"
        }
    }

    await Variant.findByIdAndUpdate(item.variantId,{
        $inc:{
            stock: item.quantity
        }
    })

    item.status = "Cancelled"

    item.cancelledAt = new Date()

    item.cancelReason = cancelReason

    recalculateOrderTotals(order)

    const allCancelled = order.items.every(
        product => product.status === "Cancelled"
    )

    if(allCancelled){
        order.orderStatus = "Cancelled"
    }

    await order.save()

    return{
        success: true
    }
}

export const getAllOrders = async() =>{

    const orders = (await Order.find().populate("userId")).toSorted({createdAt: -1})

    return orders
}