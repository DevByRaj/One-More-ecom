import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({

    offerName: {
        type: String,
        required: true,
        trim: true
    },

    appliesTo: {
        type: String,
        enum: ["PRODUCT", "CATEGORY"],
        required: true
    },

    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null
    },

    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },

    offerType: {
        type: String,
        enum: ["PERCENTAGE", "FLAT"],
        required: true
    },

    discountValue: {
        type: Number,
        required: true,
        min: [1, "Discount value must be greater than 0"]
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return value > this.startDate;
            },
            message: "End date must be after start date."
        }
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

export default mongoose.model("Offer", offerSchema);