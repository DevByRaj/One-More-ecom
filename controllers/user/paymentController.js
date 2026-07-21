import crypto from "crypto"

import { createRazorpayOrderService } from "../../services/paymentService.js";

import { getCheckoutData, placeOrderService } from "../../services/orderService.js";

export const createRazorpayOrder = async(req, res) =>{
    try {

        const userId = req.session.user

        const checkout = await getCheckoutData(userId)

        if(!checkout.success){
            return res.json({
                success: false
            })
        }

        const razorpayOrder = await createRazorpayOrderService(checkout.totals.grandTotal)

        res.json({
            success: true,
            order: razorpayOrder,
            key: process.env.RAZORPAY_KEY_ID
        })
        
    } catch (error) {
        
        console.log(error);

        res.json({
            success: false
        })
        
    }
}

export const verifyPayment = async(req, res) =>{
    try {

        const{
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            addressId
        } = req.body

        const generatedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex")

            if(generatedSignature !== razorpay_signature){
                return res.json({
                    success: false,
                    message: "Payment verification failed"
                })
            }

            const result = await placeOrderService(
                req.session.user,
                {
                    addressId,
                    paymentMethod: "RAZORPAY",
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentid: razorpay_payment_id
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