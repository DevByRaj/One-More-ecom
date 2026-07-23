import Wallet from "../models/walletModel.js"

export const getOrCreateWallet = async (userId) =>{

    let wallet = await Wallet.findOne({userId})

    if(!wallet){

        wallet = await Wallet.create({
            userId,
            balance: 0,
            transactions: []
        })

        console.log("Wallet created:", wallet);
        
    }

    return wallet
}

export const creditWallet = async(
    userId,
    amount,
    description,
    orderId = null
) =>{

    console.log("===== CREDIT WALLET CALLED =====");
    console.log(userId, amount, description);


     const wallet = await getOrCreateWallet(userId)

     wallet.balance += amount
     wallet.transactions.unshift({
        type: "Credit",
        amount,
        description,
        orderId
     })

     await wallet.save()

    console.log("Wallet after save:", wallet);

     return wallet
}

export const getWalletService = async (userId) =>{

    return await getOrCreateWallet(userId).populate("transactions.orderId")
}