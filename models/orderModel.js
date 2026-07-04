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
        default: "Pending"
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
        enum: ["COD"],
        default: "COD"
    },

    paymentStatus:{
        type: String,
        enum: ['Pending', "paid", "Failed"],
        deault: "Pending"
    },

    orderStatus:{
        type: String,
        enum:["Pending", "Shipping", "Out For Delivery", "Cancelled"],
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