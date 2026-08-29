import {
    getCheckoutData,
    placeOrderService,
    getUserOrders,
    getOrderDetailsService,
    cancelOrderItemService,
    returnOrderItemService,
    getOrderStatusInfo
} from "../../services/orderService.js"
import { applyCouponService, getAvailableCouponsService } from "../../services/couponService.js"
import { FREE_SHIPPING_LIMIT } from "../../config/appConfig.js"
import Order from "../../models/orderModel.js"
import {generateInvoice} from "../../utils/invoiceGenerator.js"

export const getBuyNow = async(req, res) =>{
    try {

        const userId = req.session.user
        
        const {productId, variantId} = req.query

        if(!productId || !variantId){
            return res.redirect("/shop")
        }

        req.session.buyNow = {
            productId, variantId
        }

        delete req.session.appliedCoupon

        return res.redirect("/checkout")
        
    } catch (error) {

        console.log(error);
        
        return res.redirect("/shop")
    }
}

export const getCheckout = async (req, res) => {
    try {

        const userId = req.session.user

        const result = await getCheckoutData(userId, req.session.appliedCoupon, req.session.buyNow)

        if (!result.success) {

            req.session.checkoutError = result.message
            return res.redirect("/cart")
        }

        const couponResult = await getAvailableCouponsService(userId, req.session.appliedCoupon?.couponId)

        return res.render("user/checkout", {
            addresses: result.addresses,
            cart: result.cart,
            totals: result.totals,
            freeShippingLimit: FREE_SHIPPING_LIMIT,
            coupons: couponResult.coupons
        })

    } catch (error) {
        console.log(error);

        return res.redirect("/cart")

    }
}


export const applyCoupon = async(req, res) =>{
    try {

        const userId = req.session.user
        const {couponCode} = req.body

        const checkout = await getCheckoutData(userId, null, req.session.buyNow || null)

        if(!checkout.success){
            return res.json({
                success: false,
                message: checkout.message || "Unable to load checkout"
            })
        }

        const result = await applyCouponService(
            userId,
            couponCode,
            checkout.totals.subtotal
        )

        if(!result.success){
            return res.json({
                success: false,
                message: result.message
            })
        }

        req.session.appliedCoupon ={
            couponId: result.coupon._id,
            couponCode: result.coupon.couponCode,
            discount: result.couponDiscount
        }
        return res.json({
            success: true,
            message: "Coupon successfully applied",
            couponCode: result.coupon.couponCode,
            discount: result.couponDiscount
        })
        
    } catch (error) {

        console.log(error);
        
        return res.json({
            success: false,
            message: "Unable to apply coupon"
        })
    }
}

export const placeOrder = async (req, res) => {
    try {

        const userId = req.session.user

        const appliedCoupon = req.session.appliedCoupon || null

        const result = await placeOrderService(
            userId,
            {
                ...req.body,
                coupon: appliedCoupon,
                buyNow: req.session.buyNow || null
            }
        )

        if (!result.success) {
            return res.json({
                success: false,
                message: result.message
            })
        }

        delete req.session.buyNow
        delete req.session.appliedCoupon

        return res.json({
            success: true,
            redirectUrl: `/order-success/${result.orderId}`
        })

    } catch (error) {
        console.log(error);

        return res.json({
            success: false,
            message: "Unable to place order"
        })
    }

}

export const getOrderSuccess = async (req, res) => {

    const orderId = req.params.id

    return res.render("user/orderSuccess", {
        orderId
    })
}

export const getOrders = async (req, res) => {
    try {

        const userId = req.session.user

        const page = Number(req.query.page) || 1

        const result = await getUserOrders(userId, page, 5)

        result.orders.forEach(order =>{
            order.statusInfo = getOrderStatusInfo(order)
        })

        return res.render("user/orders", {
            orders: result.orders,
            currentPage: result.currentPage,
            totalPages: result.totalPages
        })

    } catch (error) {

        console.log(error);
        return res.redirect("/")

    }
}

export const getOrderDetails = async (req, res) => {
    try {

        const userId = req.session.user
        const orderId = req.params.id

        const page = Number(req.query.page) || 1
        const limit = 3
        const skip = (page - 1) * limit

        const result = await getOrderDetailsService(userId, orderId)

        if (!result.success) {
            return res.redirect("/orders")
        }

        const order = result.order

        const totalItems = order.items.length
        const totalPages = Math.ceil(totalItems / limit)
        const orderItems = order.items.slice(skip, skip + limit)

        return res.render("user/orderDetails", {
            order,
            items: orderItems,
            currentPage: page,
            totalPages
        })

    } catch (error) {
        console.log(error);

        return res.redirect("/orders")

    }
}

export const cancelOrderItem = async (req, res) => {
    try {

        const userId = req.session.user

        const {orderId, itemId, page, cancelReason} = req.body

        const result = await cancelOrderItemService(
            userId,
            orderId,
            itemId,
            cancelReason
        )

        if (!result.success) {
            return res.redirect(`/orders/${orderId}?page=${page}`)
        }

        return res.redirect(`/orders/${orderId}?page=${page}`)

    } catch (error) {
        console.log(error);

        return res.redirect("/orders")

    }
}

export const returnOrderItem = async (req, res) => {
    try {

        const userId = req.session.user

        const {
            orderId,
            itemId,
            page,
            returnReason
        } = req.body

        const result = await returnOrderItemService(
            userId,
            orderId,
            itemId,
            returnReason
        )

        if (!result.success) {
            return res.redirect(`/orders/${orderId}?page=${page}`)
        }

        return res.redirect(`/orders/${orderId}?page=${page}`)

    } catch (error) {

        console.log(error);

        res.redirect("/orders")

    }
}

export const downloadInvoice = async(req,res) =>{
    try{
        
        const userId = req.session.user
        const orderId = req.params.id
        
        const order = await Order.findOne({
            _id: orderId,
            userId
        })

        if(!order){
            return res.redirect("/orders")
        }

        const deliveredItems = order.items.filter(item => item.status === "Delivered")

        if(deliveredItems.length === 0){
            return res.redirect(`/orders/${orderId}`)
        }

        const invoiceOrder = {
            ...order.toObject(),
            items: deliveredItems
        }

        for (const item of deliveredItems) {
            console.log({
                productName: item.productName,
                status: item.status,
                quantity: item.quantity,
                salePrice: item.salePrice,
                totalPrice: item.totalPrice
            });
        }

        invoiceOrder.subTotal = deliveredItems.reduce(
            (total, item) => total + item.totalPrice,
            0
        )

        invoiceOrder.discount = order.discount || 0

        invoiceOrder.shipping = order.shipping || 0

        invoiceOrder.grandTotal = invoiceOrder.subTotal - invoiceOrder.discount + invoiceOrder.shipping

        res.setHeader("Content-Type", "application/pdf")

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${order.orderId}.pdf`
        )

        generateInvoice(invoiceOrder, res)

    } catch(error){
        console.log(error);

        return res.redirect("/orders")
        
    }
}

export const getPaymentPage = async(req, res) =>{
    try {

        const userId = req.session.user

        const {addressId} = req.query

        const result = await getCheckoutData(userId, req.session.appliedCoupon, req.session.buyNow)

        if(!result.success){
            req.session.checkoutError = result.message
            return res.redirect("/cart")
        }

        const selectedAddress = result.addresses.find(
            address => address._id.toString() === addressId
        )

        if(!selectedAddress){
            return res.redirect("/checkout")
        }

        return res.render("user/payment",{
            address: selectedAddress,
            orderSummary: {
                subtotal: result.totals.subtotal,
                discount: result.totals.discount,
                shipping: result.totals.shipping,
                total: result.totals.grandTotal
            }
        })
            
    } catch (error) {

        console.log(error);
        
        return res.redirect("/checkout")
        
    }
}