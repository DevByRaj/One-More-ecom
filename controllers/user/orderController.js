import {getCheckoutData,
    placeOrderService, 
    getUserOrders, 
    getOrderDetailsService, 
    cancelOrderItemService, 
    } from "../../services/orderService.js"

export const getCheckout = async (req, res) => {
    try {

        const userId = req.session.user

        const result = await getCheckoutData(userId)

        if (!result.success) {
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

export const placeOrder = async (req, res) => {
    try {

        const userId = req.session.user

        const result = await placeOrderService(userId, req.body)

        if (!result.success) {
            return res.redirect("checkout")
        }

        return res.redirect(`/order-success/${result.orderId}`)

    } catch (error) {
        console.log(error);

        return res.redirect("/checkout")
    }

}

export const getOrderSuccess = async (req, res) => {

    const orderId = req.params.id

    return res.render("user/orderSuccess",{
        orderId
    })
}

export const getOrders = async(req, res) =>{
    try {

        const userId = req.session.user

        const orders = await getUserOrders(userId)

        return res.render("user/orders",{
            orders,
            cartcount: 0,
            wishlistCount: 0
        })
        
    } catch (error) {

        console.log(error);
        return res.redirect("/")
        
    }
}

export const getOrderDetails = async(req, res) =>{
    try {

        const userId = req.session.user
        const orderId = req.params.id

        const page = Number(req.query.page)||1
        const limit = 3
        const skip = (page-1)*limit

        const result = await getOrderDetailsService(userId, orderId)

        if(!result.success){
            return res.redirect("/orders")
        }

        const order = result.order
        
        const totalItems = order.items.length
        const totalPages = Math.ceil(totalItems/limit)
        const orderItems = order.items.slice(skip, skip+limit)

        return res.render("user/orderDetails",{
            order,
            items: orderItems,
            currentPage: page,
            totalPages
        })
        
    } catch (error) {
        console.log(error);

        return res.redirect("/orders")
        
    }
}

export const cancelOrderItem = async(req, res) =>{
    try {

        const userId = req.session.user

        const {orderId, itemId, page} = req.body

        const result = await cancelOrderItemService(
            userId,
            orderId,
            itemId
        )

        if(!result.success){
            return res.redirect(`/orders/${orderId}?page=${page}`)
        }

        return res.redirect(`/orders/${orderId}?page=${page}`)
        
    } catch (error) {
        console.log(error);

        return res.redirect("/orders")
        
    }
}