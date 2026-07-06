import { getAllOrders } from "../../services/orderService.js";

export const getOrders = async(req, res)=>{
    try {

        const orders = await getAllOrders()

        return res.render("admin/orders", {
            orders
        })
        
    } catch (error) {
    console.log(error);
    
    return res.redirect("/admin")
        
    }
}

