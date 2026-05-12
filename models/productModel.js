import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    
    productName: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true,
        trim: true
    },

    brand:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },

    category:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },

    playtime: {
        type: String,
        default: true,
        trim: true
    },

    productImage: [{
        type: String,
        required: true
    }],

    isListed:{
        type: Boolean,
        default: true
    }

},{timestamps: true})

export default mongoose.model("Product", productSchema)