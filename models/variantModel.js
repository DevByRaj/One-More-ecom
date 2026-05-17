import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({

    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required:  true
    },

    variantName: {
        type: String,
        required: true,
        trim: true
    },

    regularPrice:{
        type: Number,
        required: true
    },

    salePrice:{
        type: Number,
        required: true
    },

    stock:{
        type: Number,
        required: true,
        default: 0
    },

    sku:{
        type: String,
        required: true,
        unique: true
    },

    variantImage: [{
        type: String,
        required: true
    }],
    
    isListed:{
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

const Variant = mongoose.model("Variant", variantSchema)

export default Variant