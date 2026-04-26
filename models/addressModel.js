import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true
    },

    name: String,
    houseName: String,
    street: String,
    city: String,
    state: String,
    country: String,
    phone: String,
    pincode: String,
    
    type:{
        type: String,
        enum:["Home","Work", "Other"],
        default: "Home"
    },
     
    isDefault: {
        type: Boolean,
        default: false
    }

}, {timestamps: true})

export default mongoose.model("Address", addressSchema)