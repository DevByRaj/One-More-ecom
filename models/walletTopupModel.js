import mongoose from "mongoose";

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
        enum: ["Pending", "Paid", "Failed"],
        default: "Pending"
    }

}, {
    timestamps: true
});

export default mongoose.model("WalletTopup", walletTopupSchema);