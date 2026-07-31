import mongoose from "mongoose";

const categoryOfferSchema = new mongoose.Schema({
    categoryId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
        unique: true,
        index: true
    },

    offerType:{
        type: String,
        enum:["PERCENTAGE", "FLAT"],
        required: true,
        trim: true
    },

    discountValue:{
        type: Number,
        required: true,
        min: [1, "Discount value must be greater than 0"]
    },

    startDate:{
        type: Date,
        required: true
    },

    endDate:{
        type: Date,
        required: true,
        validate:{
            validator: function(value){
                return value > this.startDate
            },
            message: "End date must be after start date."
        }
    },

    isActive:{
        type: Boolean,
        default: true
    }
},{timestamps: true})

export default mongoose.model("CategoryOffer", categoryOfferSchema)