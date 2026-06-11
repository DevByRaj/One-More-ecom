import { addToWiishlist, getWishlist, removeWishlistitem, toggleWishlistService } from "../services/wishlistService.js";


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
        return res.json({
            success: true,
            message: "Added to wishllist"
        })
        
    } catch (error) {
        console.log(error)

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
        console.log(error);
        return res.redirect("/")        
    }
}

export const removeWishlistProduct = async(req, res) =>{
    try {

        const userId = req.session.user

        await removeWishlistitem(userId, req.params.id)

        return res.json({
            success: true
        })
        
    } catch (error) {
        console.log(error);

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
    console.log(error);

    return res.status(500).json({
        success: false
    })
    
    }
}