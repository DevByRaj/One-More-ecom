import { getAllOrders, getAdminOrderDetails, updateOrderItemStatusService, allowedStatusTransitions } from "../../services/orderService.js";

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

export const getOrderDetails = async(req, res) =>{
    try {

        const orderId = req.params.id

        const result = await getAdminOrderDetails(orderId)

        if(!result.success){
            return res.redirect("/admin/orders")
        }

        return res.render("admin/orderDetails",{
            order: result.order,
            allowedStatusTransitions: result.allowedStatusTransitions
        })
        
    } catch (error) {
        console.log(error);

        return res.redirect("/admin/orders")        
        
    }
}

export const updateOrderItemStatus = async(req, res) =>{
    try {

        const{orderId} = req.body

        await updateOrderItemStatusService(
            orderId, 
            req.body
        )

        res.redirect("/admin/orders")
        
    } catch (error) {
        console.log(error);

        res.redirect("/admin/orders")
        
    }
}


