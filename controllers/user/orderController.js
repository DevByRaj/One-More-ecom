import {getCheckoutData} from "../../services/orderService.js"

export const getCheckout = async(req, res) =>{
    try {

        const userId = req.session.user
        
        const result = await getCheckoutData(userId)

        if(!result.success){
            return res.redirect("/cart")
        }

        return res.render("user/checkout", {
            addresses: result.addresses,
            cart: result.cart,
            totals: result.totals,
            cartCount: result.cart?.items.length,
            wishlistCount: result.wishlistCount
        })
        
    } catch (error) {
        console.log(error);
        
        return res.redirect("/cart")
        
    }
}