import Coupon from "../../models/couponModel.js"
import { FREE_SHIPPING_LIMIT, SHIPPING_CHARGE } from "../../config/appConfig.js"

export const recalculateOrderTotals = async (order) => {

    const activeItems = order.items.filter(
        item => !["Cancelled", "Returned"].includes(item.status)
    )

    const subtotal = activeItems.reduce(
        (total, item) => total + item.totalPrice,
        0
    )

    let couponDiscount = 0

    if (order.coupon?.couponId && subtotal > 0) {

        const coupon = await Coupon.findById(order.coupon.couponId)

        if (coupon && subtotal >= coupon.minimumPurchase) {

            if (coupon.discountType === "FLAT") {

                couponDiscount = coupon.discountValue

            } else if (coupon.discountType === "PERCENTAGE") {

                couponDiscount = subtotal * coupon.discountValue / 100

                if (
                    coupon.maximumDiscount !== null &&
                    couponDiscount > coupon.maximumDiscount
                ) {
                    couponDiscount = coupon.maximumDiscount
                }
            }

            couponDiscount = Math.min(couponDiscount, subtotal)
        }
    }

    order.subTotal = subtotal
    order.discount = couponDiscount

    order.shipping =
        subtotal > 0 && subtotal < FREE_SHIPPING_LIMIT
            ? SHIPPING_CHARGE
            : 0

    order.grandTotal =
        order.subTotal - order.discount + order.shipping
}

export const calculateOverallOrderStatus = (items) => {

    const activeItems = items.filter(item => !["Cancelled", "Returned"].includes(item.status))

    if (items.every(item => item.status === "Cancelled")) {
        return "Cancelled"
    }

    if (activeItems.some(item => item.status === "Return Requested")) {
        return "Return Requested";
    }

    if (items.every(item => item.status === "Returned")) {
        return "Returned"
    }

    if (activeItems.length === 0) {
        return "Delivered"
    }

    if (activeItems.every(item => item.status === "Delivered")) {
        return "Delivered"
    }

    if (activeItems.some(item => item.status === "Out For Delivery")) {
        return "Out For Delivery"
    }

    if (activeItems.some(item => item.status === "Shipped")) {
        return "Shipped"
    }

    if (activeItems.some(item => item.status === "Processing")) {
        return "Processing"
    }

    if (activeItems.some(item => item.status === "Pending")) {
        return "Pending"
    }

    return "Pending"

}