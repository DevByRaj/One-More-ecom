import {
    addProductToCart,
    getUserCart,
    updateCartItemQuantity,
    removeProductFromCart,
    saveItemForLater,
    moveToCart, calculateCartTotals
} from "../../services/cartService.js"


export const addToCart = async (req, res) => {

    try {

        const userId =
            req.session.user

        const result =
            await addProductToCart(
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

        console.log(error)

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

        return res.render(
            "user/cart",
            {
                cart,
                totals,
                savedItems: cart?.savedItems || []
            }
        )

    } catch (error) {

        console.log(error)

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

        console.log(error)

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

        console.log(error)

        return res.redirect("/cart")
    }
}

export const saveForLater = async (req, res) => {
    try {

        const userId = req.session.user

        const result = await saveItemForLater(userId, req.params.id)

        return res.json(result)



    } catch (error) {
        console.log(error);
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
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "something went wrong"
        })
    }
}