import crypto from "crypto";
import Wallet from "../models/walletModel.js"
import WalletTopup from "../models/walletTopupModel.js"
import {createRazorpayOrderService} from "./paymentService.js"

export const getOrCreateWallet = async (userId) =>{

    let wallet = await Wallet.findOne({userId})

    if(!wallet){

        wallet = await Wallet.create({
            userId,
            balance: 0,
            transactions: []
        })
        
    }

    return wallet
}

export const creditWallet = async(
    userId,
    amount,
    description,
    orderId = null,
    type = "Credit"
) =>{

     const wallet = await getOrCreateWallet(userId)

     wallet.balance += amount
     wallet.transactions.unshift({
        type,
        amount,
        description,
        orderId
     })

     await wallet.save()

     return wallet
}

export const debitWallet = async(
    userId,
    amount,
    description,
    orderId = null
) =>{
    const wallet = await getOrCreateWallet(userId)

    if(wallet.balance < amount){
        return{
            success: false,
            message: "Insufficient wallet balance"
        }
    }

    wallet.balance -= amount;

    wallet.transactions.unshift({
        type: "Debit",
        amount,
        description,
        orderId
    })

    await wallet.save()

    return{
        success: true,
        wallet
    }
}

export const getWalletService = async (userId) =>{

    const wallet = await getOrCreateWallet(userId)

    await wallet.populate("transactions.orderId")

    return wallet
}

export const createWalletTopupOrderService = async(userId, amount) =>{

    if(!amount || amount < 100 || amount > 3000){
        return{
            success: false,
            message: "Invalid amount"
        }
    }

    const razorpayOrder = await createRazorpayOrderService(amount)

    await WalletTopup.create({
        userId,
        amount,
        razorpayOrderId: razorpayOrder.id
    })

    return{
        success: true,
        order: razorpayOrder,
        key: process.env.RAZORPAY_KEY_ID
    }
}

export  const verifyWalletTopupService = async(data) =>{
    
    const{
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    } = data

    const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(
            razorpay_order_id + "|" + razorpay_payment_id
        )
        .digest("hex")

    if (generatedSignature !== razorpay_signature) {
        return {
            success: false,
            message: "Payment verification failed"
        }
    }

    const topup = await WalletTopup.findOne({
        razorpayOrderId: razorpay_order_id,
        status: "Pending"
    })

    if (!topup) {
        return {
            success: false,
            message: "Top-up not found"
        }
    }

    topup.razorpayPaymentId = razorpay_payment_id;
    topup.razorpaySignature = razorpay_signature;
    topup.status = "Paid";

    await topup.save();

    await creditWallet(
        topup.userId,
        topup.amount,
        "Wallet Top-up"
    )

    return {
        success: true
    }
}