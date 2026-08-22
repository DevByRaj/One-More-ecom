import crypto from "crypto"
import Order from "../../models/orderModel.js";
import Product from "../../models/productModel.js"
import Variant from "../../models/variantModel.js";
import {createRazorpayOrderService, retryRazorpayOrderService} from "../../services/paymentService.js";
import {getCheckoutData, createPendingOrderService, placeOrderService, completeRazorpayOrderService} from "../../services/orderService.js";


export const createRazorpayOrder = async (req, res) => {
    try {

        const userId = req.session.user

        const {addressId} = req.body

        const appliedCoupon = req.session.appliedCoupon || null
        const buyNow = req.session.buyNow || null

        const checkout = await getCheckoutData(
            userId,
            appliedCoupon,
            buyNow
        )

        if (!checkout.success) {
            return res.json({
                success: false,
                message: checkout.message || "Unable to load checkout"
            })
        }

        for (const item of checkout.cart.items) {

            if (item.variantId.stock < item.quantity) {

                return res.json({
                    success: false,
                    message: `${item.productId.productName} is out of stock`
                })
            }
        }

        const razorpayOrder =
            await createRazorpayOrderService(
                checkout.totals.grandTotal
            )

        const pendingOrder =
            await createPendingOrderService(
                userId,
                {
                    addressId,
                    paymentMethod: "RAZORPAY",
                    razorpayOrderId: razorpayOrder.id
                },
                appliedCoupon,
                buyNow
            )

        if (!pendingOrder.success) {

            return res.json({
                success: false,
                message: pendingOrder.message
            })
        }

        return res.json({
            success: true,
            order: razorpayOrder,
            orderId: pendingOrder.order._id,
            key: process.env.RAZORPAY_KEY_ID
        })

    } catch (error) {

        console.log(error)

        return res.json({
            success: false,
            message: "Unable to create Razorpay order"
        })
    }
}

export const verifyPayment = async (req, res) => {
    try {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body

        const generatedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex")

        if (generatedSignature !== razorpay_signature) {
            return res.json({
                success: false,
                message: "Payment verification failed"
            })
        }

        const result = await completeRazorpayOrderService(
            req.session.user,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            req.session.buyNow || null
        )

        if (!result.success) {
            return res.json(result)
        }

        delete req.session.buyNow
        delete req.session.appliedCoupon

        return res.json(result)

    } catch (error) {

        console.log(error);

        res.json({
            success: false
        })

    }
}

export const getPaymentFailed = async (req, res) => {
    try {

        const order = await Order.findById(req.params.id)

        if (!order) {
            return res.redirect("/orders")
        }

        res.render("user/paymentFailed", {
            orderId: order.orderId,
            retryUrl: `/payment/retry/${order._id}`
        })

    } catch (error) {
        console.log(error);

        res.redirect("/orders")


    }
}

export const retryPayment = async (req, res) => {
    try {

        const userId = req.session.user
        const order = await Order.findOne({
            _id: req.params.id,
            userId
        })

        if (!order) {
            return res.json({
                success: false,
                message: "Order not found"
            })
        }

        for (const item of order.items) {

            if (item.status === "Cancelled" || item.status === "Returned") {
                continue
            }

            const variant = await Variant.findById(item.variantId)

            if (!variant || !variant.isListed) {
                return res.json({
                    success: false,
                    message: `${item.productName} is no longer available`
                })
            }

            if (variant.stock < item.quantity) {
                return res.json({
                    success: false,
                    message: `${item.productName} is out of stock`
                })
            }

            const product = await Product.findById(item.productId)

            if(!product || !product.isListed){
                return res.json({
                    success: false,
                    message: `${item.productName} is no longer available`
                })
            }
        }

        const razorpayOrder = await retryRazorpayOrderService(order.grandTotal)

        order.razorpayOrderId = razorpayOrder.id

        await order.save()

        return res.json({
            success: true,
            order: razorpayOrder,
            key: process.env.RAZORPAY_KEY_ID
        })

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Unavailabe to retry payment"
        })

    }
}