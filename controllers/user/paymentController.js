import crypto from "crypto"

import Order from "../../models/orderModel.js";

import {createRazorpayOrderService, retryRazorpayOrderService} from "../../services/paymentService.js";

import {getCheckoutData, createPendingOrderService, placeOrderService} from "../../services/orderService.js";

export const createRazorpayOrder = async (req, res) => {
    try {

        const userId = req.session.user

        const {addressId} = req.body

        const checkout = await getCheckoutData(userId, req.session.appliedCoupon)

        if (!checkout.success) {
            return res.json({
                success: false
            })
        }

        const razorpayOrder = await createRazorpayOrderService(checkout.totals.grandTotal)

        res.json({
            success: true,
            order: razorpayOrder,
            key: process.env.RAZORPAY_KEY_ID,
        })

    } catch (error) {

        console.log(error);

        res.json({
            success: false
        })

    }
}

export const verifyPayment = async (req, res) => {
    try {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            addressId
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

        const result = await placeOrderService(req.session.user,
            {
                addressId,
                paymentMethod: "RAZORPAY",
                paymentStatus: "Paid",
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature
            }
        )
        
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

        const order = await Order.findById(req.params.id)

        if (!order) {
            return res.redirect("/orders")
        }

        const razorpayOrder = await  retryRazorpayOrderService(order.grandTotal)

        order.razorpayOrderId = razorpayOrder.id
        
        await  order.save()

        res.json({
            success: true,
            order: razorpayOrder,
            key: process.env.RAZORPAY_KEY_ID
        })

    } catch (error) {

        console.log(error);

        res.redirect("/orders")

    }
}