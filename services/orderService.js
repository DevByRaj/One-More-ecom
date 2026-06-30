import Address from "../models/addressModel.js"
import Wishlist from "../models/wishlistModel.js"
import { getUserCart, calculateCartTotals } from "./cartService.js"

export const getCheckoutData = async(userId) =>{

    const addresses = await Address.find({userId})
        .sort({isDefault: -1, createdAt: -1});

    const cart = await getUserCart(userId)

    if(!cart || cart.items.length === 0){
        return{
            success: false
        }
    }

    const totals = calculateCartTotals(cart)

    const wishlist = await Wishlist.findOne({userId})

    const wishlistCount = wishlist?wishlist.products.length:0

    return{
        success: true,
        addresses,
        cart,
        totals,
        wishlistCount
    }

}