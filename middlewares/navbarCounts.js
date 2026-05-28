import Cart from "../models/cartModel.js"
import Wishlist from "../models/wishlistModel.js"


const navbarCounts = async(req, res, next) =>{
    try {

        res.locals.cartCount = 0
        res.locals.wishlistCount = 0

        if(req.session.user){
            
            const userId = req.session.user

            const cart = await Cart.findOne({userId})

            const wishlist = await Wishlist.findOne({userId})

            if(cart && cart.items){
                res.locals.cartCount = cart.items.length
            }

            if(wishlist && wishlist.products){
                res.locals.wishlistCount = wishlist.products.length
            }
        }

        next()
        
    } catch (error) {
        console.log(error);
        next()        
    }
}

export default navbarCounts