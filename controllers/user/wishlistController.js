import { addToWiishlist, getWishlist, removeWishlistitem, toggleWishlistService } from "../../services/wishlistService.js";
import logger from "../../utils/logger.js";

export const addWishlist = async(req, res) =>{
    try {

        const userId = req.session.user

        const result = await addToWiishlist(userId, req.body)

        if(!result.success){
            return res.status(400).json({
                success: false,
                message: result.message
            })
        }
        const wishlist = await getWishlist(userId)

        return res.json({
            success: true,
            message: "Added to wishlist",
            wishlistCount: wishlist ? wishlist.products.length : 0
        })
        
    } catch (error) {
        logger.error("Failed to add product to wishlist",{
            message: error.message,
            stack: error.stack
        })

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}

export const getWishlistPage = async(req, res) =>{
    try {
        
        const userId = req.session.user

        const wishlist = await getWishlist(userId)

        return res.render("user/wishlist", {
            wishlist
        })
        
    } catch (error) {
        logger.error("Failed to load wishlist page",{
            message: error.message,
            stack: error.message
        })
        return res.redirect("/")        
    }
}

export const removeWishlistProduct = async(req, res) =>{
    try {

        const userId = req.session.user

        await removeWishlistitem(userId, req.params.id)

        const wishlist = await getWishlist(userId)

        return res.json({
            success: true,
            wishlistCount: wishlist ? wishlist.products.length : 0
        })
        
    } catch (error) {
        logger.error("Failed to remove product from wishlist",{
            message: error.message,
            stack: error.stack
        })

        return res.status(500).json({
            success: false
        })
    }
}

export const toggleWishlist = async(req, res) =>{
    try {

        const userId = req.session.user

        const result =  await toggleWishlistService(userId, req.body)

        return res.json(result)
        
    } catch (error) {
    logger.error("Failed to toggle wishlist", {
        message: error.message,
        stack: error.stack
    })

    return res.status(500).json({
        success: false
    })
    
    }
}