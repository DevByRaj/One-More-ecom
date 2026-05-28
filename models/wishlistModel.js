import mongoose, {mongo} from "mongoose";
import Variant from "./variantModel.js";

const wishlistSchema = new mongoose.Schema({

    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },

    products:[{
        productId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        },

        variantId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Variant'
    }
    }]
}, {timestamps: true})

export default mongoose.model("Wishlist", wishlistSchema)