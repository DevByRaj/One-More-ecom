import mongoose from "mongoose";

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
    regularPrice: String,
    salePrice: Number,
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

    paymentMethod:{
        type: String,
        enum: ["COD",
            "RAZORPAY", 
            "WALLET"],
        default: "COD"
    },

    paymentStatus:{
        type: String,
        enum: ["Pending", 
             "Paid", 
             "Failed",
             "Refunded"],
        default: "Pending"
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
    grandTotal: Number
},{
    timestamps: true
})

export default mongoose.model("Order", orderSchema)