import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({

    brandName:{
        type: String,
        required: true,
        unique: true
    },

    isListed: {
        type: Boolean,
        default: true
    }
}, {timestamps: true})

export default mongoose.Schema("Brand", brandSchema)