import Address from "../../models/addressModel.js";
import Product from "../../models/productModel.js"
import Order from "../../models/orderModel.js"
import Cart from "../../models/cartModel.js"
import Variant from "../../models/variantModel.js"
import Coupon from "../../models/couponModel.js"
import {calculateCartTotals} from "../cartService.js"
import {calculateBestOffer} from "../offerCalulationService.js"
import {PAYMENT_STATUS, ORDER_STATUS} from "../../constants/orderConstants.js"
import { applyCouponService } from "../couponService.js";

const generateOrderId = () => {
    return "ORD" + Date.now()
}

export const placeOrderService = async (userId, orderData, session = null) => {

    const {addressId,
        paymentMethod,
        paymentStatus = PAYMENT_STATUS.PENDING,
        razorpayOrderId = null,
        razorpayPaymentId = null,
        coupon = null,
        buyNow = null} = orderData

    let cart

    if (buyNow) {

        const product = await Product.findById(buyNow.productId)
        const variant = await Variant.findById(buyNow.variantId)

        if (!product || !product.isListed ||
            !variant || !variant.isListed
        ) {
            return {
                success: false,
                message: "Product unavailable"
            }
        }
        if (variant.stock <= 0) {
            return {
                success: false,
                message: "Out of stock"
            }
        }

        cart = {
            items: [{
                productId: product,
                variantId: variant,
                quantity: 1
            }]
        }
    } else {
        cart = await Cart.findOne({userId}).populate("items.productId").populate("items.variantId")

        if (!cart || cart.items.length === 0) {
            return {
                success: false,
                message: "Cart is empty"
            }
        }
    }

    const address = await Address.findOne({
        _id: addressId,
        userId
    })

    if (!address) {
        return {
            success: false,
            message: "Address not found"
        }
    }
    for (const item of cart.items) {
        item.offer = await calculateBestOffer(
            item.productId,
            item.variantId
        );
    }

    const couponDiscount = coupon?.discount || 0

    const totals = calculateCartTotals(cart, couponDiscount)

    for (const item of cart.items) {

        if (item.variantId.stock < item.quantity) {
            return {
                success: false,
                message: `${item.productId.productName} has only ${item.variantId.stock} item(s) available`
            }
        }
    }

    const orderItems = await Promise.all(
        cart.items.map(async (item) => {

            const offer = await calculateBestOffer(
                item.productId, item.variantId
            )

            return {
                productId: item.productId._id,

                variantId: item.variantId._id,

                productName: item.productId.productName,

                variantName: item.variantId.variantName,

                productImage: item.variantId.variantImage[0],

                quantity: item.quantity,

                regularPrice: item.variantId.regularPrice,

                salePrice: offer.finalPrice,

                offerDiscount: offer.discountAmount * item.quantity,

                totalPrice: offer.finalPrice * item.quantity,

                status: ORDER_STATUS.PENDING
            }
        })
    )

    if (coupon?.couponId) {

        const updatedCoupon = await Coupon.findOneAndUpdate(
            {
                _id: coupon.couponId,
                $or: [
                    {usageLimit: null},
                    {
                        $expr: {
                            $lt: ["$usedCount", "$usageLimit"]
                        }
                    }
                ]
            },
            {
                $inc: {
                    usedCount: 1
                }
            },
            {
                returnDocument: "after",
                ...(session ? {session} : {})
            }
        )

        if (!updatedCoupon) {
            return {
                success: false,
                message: "Coupon usage limit reached"
            }
        }
    }

    const orderDataToCreate = {
        orderId: generateOrderId(),
        userId,
        items: orderItems,
        address: {
            name: address.name,
            houseName: address.houseName,
            street: address.street,
            city: address.city,
            state: address.state,
            country: address.country,
            phone: address.phone,
            pincode: address.pincode
        },
        paymentMethod,
        paymentStatus,
        razorpayOrderId,
        razorpayPaymentId,
        orderStatus: ORDER_STATUS.PENDING,
        coupon: coupon
            ? {
                couponId: coupon.couponId,
                couponCode: coupon.couponCode
            }
            : null,
        subTotal: totals.subtotal,
        shipping: totals.shipping,
        discount: totals.discount,
        grandTotal: totals.grandTotal
    }

    const order = await Order.create(
        [orderDataToCreate],
        session ? {session} : undefined
    )

    const createdOrder = order[0]


    for (const item of cart.items) {
        await Variant.findByIdAndUpdate(
            item.variantId._id,
            {
                $inc: {
                    stock: -item.quantity
                }
            },
            session ? {session} : undefined
        )
    }

    if (!buyNow) {

        cart.items = []
        await cart.save(session ? {session} : undefined)

    }
    return {
        success: true,
        orderId: createdOrder._id
    }
}

export const createPendingOrderService = async (userId, orderData, appliedCoupon = null, buyNow = null) => {

    const {
        addressId,
        paymentMethod,
        razorpayOrderId = null
    } = orderData

    let cart

    if (buyNow) {

        const product = await Product.findById(buyNow.productId)
        const variant = await Variant.findById(buyNow.variantId)

        if (
            !product ||
            !product.isListed ||
            !variant ||
            !variant.isListed
        ) {
            return {
                success: false,
                message: "Product unavailable"
            }
        }

        if (variant.stock <= 0) {
            return {
                success: false,
                message: "Out of stock"
            }
        }

        cart = {
            items: [{
                productId: product,
                variantId: variant,
                quantity: 1
            }]
        }

    } else {

        cart = await Cart.findOne({userId})
            .populate("items.productId")
            .populate("items.variantId")

        if (!cart || cart.items.length === 0) {
            return {
                success: false,
                message: "Cart is empty"
            }
        }
    }

    const address = await Address.findOne({
        _id: addressId,
        userId
    })

    if (!address) {
        return {
            success: false,
            message: "Address not found"
        }
    }

    for (const item of cart.items) {

        item.offer = await calculateBestOffer(
            item.productId,
            item.variantId
        )
    }

    for (const item of cart.items) {

        if (item.variantId.stock < item.quantity) {
            return {
                success: false,
                message: `${item.productId.productName} is out of stock`
            }
        }
    }

    let couponDiscount = 0

    if (appliedCoupon?.couponCode) {

        const couponResult = await applyCouponService(
            userId,
            appliedCoupon.couponCode,
            calculateCartTotals(cart).subtotal
        )

        if (!couponResult.success) {
            return {
                success: false,
                message: couponResult.message
            }
        }

        couponDiscount = couponResult.couponDiscount
    }

    const totals = calculateCartTotals(
        cart,
        couponDiscount
    )

    const orderItems = await Promise.all(
        cart.items.map(async (item) => {

            const offer = await calculateBestOffer(
                item.productId,
                item.variantId
            )

            return {
                productId: item.productId._id,

                variantId: item.variantId._id,

                productName: item.productId.productName,

                variantName: item.variantId.variantName,

                productImage: item.variantId.variantImage[0],

                quantity: item.quantity,

                regularPrice: item.variantId.regularPrice,

                salePrice: offer.finalPrice,

                offerDiscount: offer.discountAmount * item.quantity,

                totalPrice:
                    offer.finalPrice * item.quantity,

                status: ORDER_STATUS.PENDING
            }
        })
    )

    const order = await Order.create({

        orderId: generateOrderId(),

        userId,

        items: orderItems,

        address: {
            name: address.name,
            houseName: address.houseName,
            street: address.street,
            city: address.city,
            state: address.state,
            country: address.country,
            phone: address.phone,
            pincode: address.pincode
        },

        paymentMethod,

        paymentStatus: PAYMENT_STATUS.PENDING,

        razorpayOrderId,

        razorpayPaymentId: null,

        orderStatus: ORDER_STATUS.PENDING,

        coupon: appliedCoupon
            ? {
                couponId: appliedCoupon.couponId,
                couponCode: appliedCoupon.couponCode
            }
            : null,

        subTotal: totals.subtotal,

        shipping: totals.shipping,

        discount: totals.discount,

        grandTotal: totals.grandTotal
    })

    return {
        success: true,
        order
    }
}
