import Address from "../../models/addressModel.js"
import Product from "../../models/productModel.js"
import Wishlist from "../../models/wishlistModel.js"
import Variant from "../../models/variantModel.js"

import {getUserCart, calculateCartTotals} from "../cartService.js"
import {calculateBestOffer} from "../offerCalulationService.js"
import {applyCouponService} from "../couponService.js"

export const getCheckoutData = async (userId, appliedCoupon = null, buyNow = null) => {

    const addresses = await Address.find({userId})
        .sort({isDefault: -1, createdAt: -1});

    let cart
    if (buyNow) {

        const product = await Product.findById(buyNow.productId)
        const variant = await Variant.findById(buyNow.variantId)

        if (!product || !product.isListed ||
            !variant || !variant.isListed ||
            variant.stock <= 0
        ) {
            return {
                success: false,
                message: "Product unavailabe"
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
        cart = await getUserCart(userId)

        if (!cart || cart.items.length === 0) {
            return {
                success: false
            }
        }
    }

    for (const item of cart.items) {
        if (!item.variantId || item.variantId.stock < item.quantity) {
            return {
                success: false,
                message: `${item.productId.productName} has only ${item.variantId?.stock || 0} item(s) available`
            }
        }
    }

    for (const item of cart.items) {
        item.offer = await calculateBestOffer(item.productId, item.variantId)
    }

    let couponDiscount = 0

    if (appliedCoupon?.couponCode) {

        const couponResult = await applyCouponService(
            userId,
            appliedCoupon.couponCode,
            calculateCartTotals(cart).subtotal
        )

        if (couponResult.success) {
            couponDiscount = couponResult.couponDiscount
        }
    }

    const totals = calculateCartTotals(cart, couponDiscount)

    const wishlist = await Wishlist.findOne({userId})

    const wishlistCount = wishlist ? wishlist.products.length : 0

    return {
        success: true,
        addresses,
        cart,
        totals,
        wishlistCount
    }

}