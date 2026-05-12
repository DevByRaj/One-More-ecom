import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({

    name:{
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    isListed: {
        type: Boolean,
        default: true
    }
}, {timestamps: true})

export default mongoose.model("Brand", brandSchema)