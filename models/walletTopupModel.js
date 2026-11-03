import mongoose from "mongoose";
import { PAYMENT_STATUS } from "../constants/orderConstants.js";

const walletTopupSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    razorpayOrderId: {
        type: String,
        required: true
    },

    razorpayPaymentId: {
        type: String,
        default: null
    },

    razorpaySignature: {
        type: String,
        default: null
    },

    status: {
        type: String,
        enum: [
            PAYMENT_STATUS.PENDING,
            PAYMENT_STATUS.PAID,
            PAYMENT_STATUS.FAILED
        ],
        default: PAYMENT_STATUS.PENDING
    }

}, {
    timestamps: true
});

export default mongoose.model("WalletTopup", walletTopupSchema);