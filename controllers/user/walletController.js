import { getWalletService } from "../../services/walletService.js"

export const getWallet = async(req, res) =>{
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