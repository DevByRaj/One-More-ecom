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
        console.log("FULL ERROR:");
        console.log(error, {depth: null});

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
        console.log(error);

        throw error

    }
}