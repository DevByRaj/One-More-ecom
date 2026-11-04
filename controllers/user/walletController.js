import logger from "../../utils/logger.js"
import { getWalletService } from "../../services/walletService.js"
import { payWithWalletService } from "../../services/orderService.js"
import { createWalletTopupOrderService, verifyWalletTopupService } from "../../services/walletService.js"

export const getWallet = async(req, res) =>{

    try{
        const  userId = req.session.user

        const wallet = await getWalletService(userId)

        return res.render("user/wallet", {
            wallet
        })
    } catch(error){
        logger.error("Failed to load user wallet", {
            message: error.message,
            stack: error.stack
        })
        
        return res.redirect("/")
    }
}

export const payWithWallet = async (req, res) => {
    try {

        const userId = req.session.user

        const result = await payWithWalletService(
            userId,
            req.body,
            req.session.appliedCoupon,
            req.session.buyNow || null
        )

        if (!result.success) {
            return res.json(result)
        }

        delete req.session.buyNow

        return res.json(result)

    } catch (error) {
        logger.error("Wallet payment failed", {
            message: error.message,
            stack: error.stack
        })

        return res.json({
            success: false,
            message: "Wallet payment failed"
        })

    }
}

export const createWalletTopupOrder = async(req, res) =>{
    try {

        const userId = req.session.user
        
        const {amount} = req.body
        
        const result = await createWalletTopupOrderService(
            userId,
            Number(amount)
        )

        res.json(result)
        
    } catch (error) {
        logger.error("Failed to create wallet top-up order", {
            message: error.message,
            stack: error.stack
        })
        
        res.json({
            success: false
        })
    }
}

export const verifyWalletTopupPayment = async(req, res) =>{
    try {

        const result = await verifyWalletTopupService(req.body)

        res.json(result)
        
    } catch (error) {
        logger.error("Failed to verify wallet top-up payment", {
            message: error.message,
            stack: error.stack
        })

        res.json({
            success: false
        })
        
    }
}