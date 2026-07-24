import Wallet from "../models/walletModel.js"

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
    orderId = null
) =>{

     const wallet = await getOrCreateWallet(userId)

     wallet.balance += amount
     wallet.transactions.unshift({
        type: "Credit",
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