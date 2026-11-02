import mongoose from "mongoose";
import {
    PAYMENT_STATUS,
    PAYMENT_METHOD
} from "../constants/orderConstants.js"

const orderItemschema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Variant",
        required: true
    },

    productName: String,
    variantName: String,
    productImage: String,
    quantity: Number,
    regularPrice: Number,
    salePrice: Number,
    offerDiscount: {
        type: Number,
        default: 0
    },
    totalPrice: Number,

    status:{
        type: String,
        enum: ["Pending", 
            "Processing",
            "Shipped", 
            "Out For Delivery", 
            "Delivered", 
            "Cancelled", 
            "Return Requested", 
            "Returned"],
        default: "Pending"
    },

    cancelledAt:{
        type: Date,
        default: null
    },

    cancelReason:{
        type: String,
        default: ""
    },

    returnedAt:{
        type: Date,
        default: null
    },

    returnReason:{
        type: String,
        default: ""
    }
})

const orderSchema = new mongoose.Schema({

    orderId:{
        type: String,
        unique: true
    },

    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    items: [orderItemschema],

    address:{
        name: String,
        houseName: String,
        street: String,
        city: String,
        state: String,
        country: String,
        phone: String,
        pincode: String
    },

    paymentMethod: {
        type: String,
        enum: Object.values(PAYMENT_METHOD),
        default: PAYMENT_METHOD.COD
    },

    paymentStatus: {
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.PENDING
    },

    razorpayOrderId: {
        type: String,
        default: null
    },

    razorpayPaymentId: {
        type: String,
        default: null
    },

    razorpaySignature: {
        type: String,
        default: null
    },

    orderStatus:{
        type: String,
        enum:["Pending", 
            "Processing",
            "Shipped", 
            "Out For Delivery",
            "Delivered", 
            "Cancelled", 
            "Return Requested", 
            "Returned"],
        default: "Pending"
    },

    subTotal: Number,
    shipping: Number,
    discount: Number,
    coupon: {
        couponId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Coupon",
            default: null
        },
        couponCode: {
            type: String,
            default: null
        }
    },
    grandTotal: Number
},{
    timestamps: true
})

export default mongoose.model("Order", orderSchema)