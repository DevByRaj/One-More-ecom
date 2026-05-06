import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    productname: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
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

    regularPrice:{
        type: Number,
        required: true
    },
    
    salePrice:{
        type: Number,
        required: true
    },

    quantity:{
        type: Number,
        required: true
    },

    productImage: [{
        type: String
    }],

    isBlocked:{
        type: Boolean,
        default: false
    },

    isListed:{
        type: Boolean,
        default: true
    }

},{timestamps: true})

export default mongoose.model("Product", productSchema)