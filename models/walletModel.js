import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["Credit", "Debit"],
        requred: true
    },
    amount:{
        type: Number,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    orderId:{
        type: mongoose.Schema.Types,ObjectId,
        ref:"Order",
        default: null
    }
}, {
    timestamps: true
})

const walletSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        unique: true,
        required: true
    },

    balance: {
        type: Number,
        dafault: 0
    },
    transactions: [walletTransactionSchema]
},{
    timestamps: true
})

export default mongoose.model("wallet", walletSchema)