import Coupon from "../../models/couponModel.js"
import { FREE_SHIPPING_LIMIT, SHIPPING_CHARGE } from "../../config/appConfig.js"
import { ORDER_STATUS } from "../../constants/orderConstants.js"

export const recalculateOrderTotals = async (order) => {

    const activeItems = order.items.filter(
        item => ![ORDER_STATUS.CANCELLED,ORDER_STATUS.RETURNED].includes(item.status)
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

    const activeItems = items.filter(item => ![ORDER_STATUS.CANCELLED, ORDER_STATUS.RETURNED].includes(item.status))

    if (items.every(item => item.status === ORDER_STATUS.CANCELLED)) {
        return ORDER_STATUS.CANCELLED
    }

    if (activeItems.some(item => item.status === ORDER_STATUS.RETURN_REQUESTED)) {
        return ORDER_STATUS.RETURN_REQUESTED;
    }

    if (items.every(item => item.status === ORDER_STATUS.RETURNED)) {
        return ORDER_STATUS.RETURNED
    }

    if (activeItems.length === 0) {
        return ORDER_STATUS.DELIVERED
    }

    if (activeItems.every(item => item.status === ORDER_STATUS.DELIVERED)) {
        return ORDER_STATUS.DELIVERED
    }

    if (activeItems.some(item => item.status === ORDER_STATUS.OUT_FOR_DELIVERY)) {
        return ORDER_STATUS.OUT_FOR_DELIVERY
    }

    if (activeItems.some(item => item.status === ORDER_STATUS.SHIPPED)) {
        return ORDER_STATUS.SHIPPED
    }

    if (activeItems.some(item => item.status === ORDER_STATUS.PROCESSING)) {
        return ORDER_STATUS.PROCESSING
    }

    if (activeItems.some(item => item.status === ORDER_STATUS.PENDING)) {
        return ORDER_STATUS.PENDING
    }

    return ORDER_STATUS.PENDING

}