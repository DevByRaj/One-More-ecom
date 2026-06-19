import Wishlist from "../models/wishlistModel.js";
import Product from "../models/productModel.js"
import Variant from "../models/variantModel.js";


export const addToWiishlist = async (userId, data) => {

    const {productId, variantId} = data

    const product = await Product.findById(productId)

    if (!product || !product.isListed) {
        return {
            success: false,
            message: 'Product unavailable'
        }
    }

    const variant = await Variant.findById(variantId)

    if (!variant || !variant.isListed) {
        return {
            success: false,
            message: "Variant unavailable"
        }
    }

    let wishlist = await Wishlist.findOne({userId})

    if (!wishlist) {

        wishlist = new Wishlist({
            userId,
            products: []
        })
    }

    const existingProduct = await wishlist.products.find(item => item.variantId.toString() === variantId)

    if (existingProduct) {
        return {
            success: false,
            message: "Already in wishlist"
        }
    }

    wishlist.products.push({
        productId,
        variantId
    })

    await wishlist.save()

    return {
        success: true,
        action: "added",
        message: "Product added to wishlist"
    }
}

export const getWishlist = async (userId) => {

    const wishlist = await Wishlist.findOne({
        userId
    })
        .populate("products.productId")
        .populate("products.variantId")

    if (wishlist) {

        const validItems = wishlist.products.filter(
            item => item.productId && item.productId.isListed && item.variantId && item.variantId.isListed
        )

        if (validItems.length !== wishlist.products.length) {

            wishlist.products = validItems

            await wishlist.save()
        }
    }

    return wishlist
}

export const removeWishlistitem = async (userId, wishlistItemId) => {

    await Wishlist.updateOne({userId}, {
        $pull: {
            products: {_id: wishlistItemId}
        }
    })
}

export const toggleWishlistService = async (userId, data) => {

    const {productId, variantId} = data

    const product = await Product.findById(productId)

    const variant = await Variant.findById(variantId)

    if (!product || !product.isListed || !variant || !variant.isListed) {
        return {
            success: false,
            message: "Product unavailable"
        }
    }

    let wishlist = await Wishlist.findOne({userId})

    if (!wishlist) {

        wishlist = new Wishlist({
            userId,
            products: []
        })
    }

    const existingItem = wishlist.products.find(
        item => item.variantId.toString() === variantId
    )

    if (existingItem) {

        wishlist.products.pull(existingItem._id)

        await wishlist.save()

    }

    wishlist.products.push({
        productId,
        variantId
    })

    await wishlist.save()

    return {
        success: true,
        action: "added",
        message: "Product added to wishlist",
        wishlistCount: wishlist.products.length
    }
}