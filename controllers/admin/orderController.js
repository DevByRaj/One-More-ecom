import { getAllOrders, getAdminOrderDetails, updateOrderItemStatusService, allowedStatusTransitions } from "../../services/orderService.js";

export const getOrders = async(req, res)=>{
    try {

        const page = Number(req.query.page) || 1

        const search = req.query.search || ""

        const status = req.query.status || ""

        const sort = req.query.sort || "newest"

        const result = await getAllOrders(page, 5, search, status, sort)

        return res.render("admin/orders",{
            orders: result.orders,
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            limit: 5,
            search,
            status,
            sort
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

        return res.status(200).json({
            success: true,
            messaage: "Order status updated successfully"
        })
        
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message
        })
        
    }
}


