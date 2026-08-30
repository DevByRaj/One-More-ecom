import mongoose from "mongoose";

const referralOfferSchema = new mongoose.Schema({

    offerName: {
        type: String,
        required: true,
        trim: true
    },

    referrerReward: {
        type: Number,
        required: true,
        min: [1, "Referrer reward must be greater than 0"]
    },

    referredUserReward: {
        type: Number,
        required: true,
        min: [1, "Referred user reward must be greater than 0"]
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
})

export default mongoose.model("ReferralOffer", referralOfferSchema);