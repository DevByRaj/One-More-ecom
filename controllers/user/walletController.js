import { getWalletService } from "../../services/walletService.js"
import { payWithWalletService } from "../../services/orderService.js"

export const getWallet = async(req, res) =>{

    console.log("Wallet route hit")
    try{
        const  userId = req.session.user

        const wallet = await getWalletService(userId)

        return res.render("user/wallet", {
            wallet
        })
    } catch(error){
        console.log(error);
        
        return res.redirect("/")
    }
}

export const payWithWallet = async(req, res) =>{
    try {

        const userId = req.session.user

        const result = await payWithWalletService(userId, req.body)

        res.json(result)
        
    } catch (error) {

        console.log(error);
        
        res.json({
            success: false,
            message: "Wallet payment failed"
        })
        
    }
}