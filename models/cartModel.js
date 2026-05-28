import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    items: [{
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

        quantity: {
            type: Number,
            default: 1
        }
    }]
}, {timestamps: true})

export default mongoose.model("cart", cartSchema)