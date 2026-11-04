import logger from "../../utils/logger.js"
import {
    addProductToCart,
    getUserCart,
    updateCartItemQuantity,
    removeProductFromCart,
    saveItemForLater,
    moveToCart, removeSaveditemService, calculateCartTotals
} from "../../services/cartService.js"
import { FREE_SHIPPING_LIMIT } from "../../config/appConfig.js"

export const addToCart = async (req, res) => {

    try {

        const userId = req.session.user

        const result = await addProductToCart(
                userId,
                req.body
            )
        if (!result.success) {

            return res.status(400).json({
                success: false,
                message: result.message
            })
        }

        return res.json({
            success: true,
            message: "Product added to cart",
            cartCount: result.cartCount,
            wishlistCount: result.wishlistCount
        });

    } catch (error) {
        logger.error("Failed to add product to cart", {
            message: error.message,
            stack: error.stack
        })

        return res.status(500).json({
            success: false,
            message:
                "Something went wrong"
        })
    }
}

export const getCart = async (req, res) => {

    try {

        const userId = req.session.user

        const cart = await getUserCart(userId)

        const totals = calculateCartTotals(cart)

        const checkoutError = req.session.checkoutError

        delete req.session.checkoutError

        return res.render(
            "user/cart",
            {
                cart,
                totals,
                savedItems: cart?.savedItems || [],
                freeShippingLimit: FREE_SHIPPING_LIMIT,
                checkoutError
            }
        )

    } catch (error) {
        logger.error("Failed to load user cart", {
            message: error.message,
            stack: error.stack
        })

        return res.redirect("/")
    }
}

export const updateCartQuantity = async (req, res) => {
    try {

        const userId = req.session.user

        const result = await updateCartItemQuantity(
            userId,
            req.body
        )

        return res.json(result)

    } catch (error) {
        logger.error("Failed to update cart quantity", {
            message: error.message,
            stack: error.stack
        })

        return res.status(500).json({
            success: false
        })
    }
}

export const removeCartItem = async (req, res) => {

    try {

        const userId =
            req.session.user

        await removeProductFromCart(
            userId,
            req.params.id
        )

        return res.redirect("/cart")

    } catch (error) {
        logger.error("Failed to remove cart item", {
            message: error.message,
            stack: error.stack
        })

        return res.redirect("/cart")
    }
}

export const saveForLater = async (req, res) => {
    try {

        const userId = req.session.user

        const result = await saveItemForLater(userId, req.params.id)

        return res.json(result)



    } catch (error) {
        logger.error("Failed to save cart item for later", {
            message: error.message,
            stack: error.stack
        })
        return res.status(500).json({
            success: false
        })

    }
}

export const moveSavedItemToCart = async (req, res) => {
    try {

        const userId = req.session.user

        const result = await moveToCart(userId, req.params.id)

        return res.json(result)

    } catch (error) {
        logger.error("Failed to move saved item to cart",{
            message: error.message,
            stack: error.stack
        })

        return res.status(500).json({
            success: false,
            message: "something went wrong"
        })
    }
}

export const removeSaveditem = async(req, res) =>{
    try {

        const userId = req.session.user
        const result = await removeSaveditemService(userId, req.params.id)

        return res.json(result)
        
    } catch (error) {
        logger.error("Failed to remove saved cart item", {
            message: error.message,
            stack: error.stack
        })
        
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}