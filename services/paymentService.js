import logger from "../utils/logger.js";
import razorpay from "../utils/razorpay.js";

export const createRazorpayOrderService = async (amount) => {

    try {

        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        })

        return order


    } catch (error) {
        logger.error("Failed to create Razorpay order", {
            message: error.message,
            stack: error.stack
        })

        throw error
    }
}

export const retryRazorpayOrderService = async (amount) => {
    try {

        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        })

        return order

    } catch (error) {
        logger.error("Failed to retry Razorpay order creation", {
            message: error.message,
            stack: error.stack
        })

        throw error
    }
}