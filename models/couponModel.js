import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({

    couponCode:{
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },

    description:{
        type: String,
        default: ""
    },

    discountType:{
        type: String,
        enum: ["PERCENTAGE", "FLAT"],
        required: true
    },

    discountValue:{
        type: Number,
        required: true,
        min: 0
    },
    minimumPurchase:{
        type: Number,
        default: 0
    },

    maximumDiscount:{
        type: Number,
        default: null
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    usageLimit: {
        type: Number,
        default: null
    },

    usedCount: {
        type: Number,
        default: 0
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
})

export default mongoose.model("Coupon", couponSchema)