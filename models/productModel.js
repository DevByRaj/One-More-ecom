import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    brand: String,
    price: Number,
    image: String,
    description: String,
    isListed:{
        type: Boolean,
        default: true
    }
},{timestamps: true})

export default mongoose.model("Product", productSchema)