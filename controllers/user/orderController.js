import {
    getCheckoutData,
    placeOrderService,
    getUserOrders,
    getOrderDetailsService,
    cancelOrderItemService,
    returnOrderItemService,
    getOrderStatusInfo
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
            totals: result.totals
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

    return res.render("user/orderSuccess", {
        orderId
    })
}

export const getOrders = async (req, res) => {
    try {

        const userId = req.session.user

        const page = Number(req.query.page) || 1

        const result = await getUserOrders(userId, page, 5)

        result.orders.forEach(order =>{
            order.statusInfo = getOrderStatusInfo(order)
        })

        return res.render("user/orders", {
            orders: result.orders,
            currentPage: result.currentPage,
            totalPages: result.totalPages
        })

    } catch (error) {

        console.log(error);
        return res.redirect("/")

    }
}

export const getOrderDetails = async (req, res) => {
    try {

        const userId = req.session.user
        const orderId = req.params.id

        const page = Number(req.query.page) || 1
        const limit = 3
        const skip = (page - 1) * limit

        const result = await getOrderDetailsService(userId, orderId)

        if (!result.success) {
            return res.redirect("/orders")
        }

        const order = result.order

        const totalItems = order.items.length
        const totalPages = Math.ceil(totalItems / limit)
        const orderItems = order.items.slice(skip, skip + limit)

        return res.render("user/orderDetails", {
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

export const cancelOrderItem = async (req, res) => {
    try {

        const userId = req.session.user

        const {orderId, itemId, page, cancelReason} = req.body

        const result = await cancelOrderItemService(
            userId,
            orderId,
            itemId,
            cancelReason
        )

        if (!result.success) {
            return res.redirect(`/orders/${orderId}?page=${page}`)
        }

        return res.redirect(`/orders/${orderId}?page=${page}`)

    } catch (error) {
        console.log(error);

        return res.redirect("/orders")

    }
}

export const returnOrderItem = async (req, res) => {
    try {

        const userId = req.session.user

        const {
            orderId,
            itemId,
            page,
            returnReason
        } = req.body

        const result = await returnOrderItemService(
            userId,
            orderId,
            itemId,
            returnReason
        )

        if (!result.success) {
            return res.redirect(`/orders/${orderId}?page=${page}`)
        }

        return res.redirect(`/orders/${orderId}?page=${page}`)

    } catch (error) {

        console.log(error);

        res.redirect("/orders")

    }
}