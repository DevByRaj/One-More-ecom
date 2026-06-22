import Cart from "../models/cartModel.js"
import Product from "../models/productModel.js"
import Variant from "../models/variantModel.js"

export const addProductToCart = async (userId, cartData) => {

        const {
            productId,
            variantId
        } = cartData

        const product =
            await Product.findById(productId)

        if(!product || !product.isListed){

            return {
                success: false,
                message: "Product unavailable"
            }
        }

        const variant = await Variant.findById(variantId)

        if(!variant || !variant.isListed){

            return {
                success: false,
                message: "Variant unavailable"
            }
        }


        if(variant.stock <= 0) {

            return {
                success: false,
                message: "Out of stock"
            }
        }

        let cart = await Cart.findOne({userId})

        if(!cart){
            cart = new Cart({
                userId,
                items: []
            })
        }

        const existingItem = cart.items.find(item => item.variantId.toString() === variantId)

        if(existingItem){

            if(existingItem.quantity >= 5){

                return {
                    success: false,
                    message: "Maximum quantity reached"
                }
            }

            if(existingItem.quantity >= variant.stock){

                return {
                    success: false,
                    message: "Insufficient stock"
                }
            }

            existingItem.quantity += 1

        }else {

            if(cart.items.length >= 6){
                return{
                    success: false,
                    message: "Cart is full"
                }
            }

            cart.items.push({
                productId,
                variantId,
                quantity: 1
            })
        }

        await cart.save()

        return {
            success: true
        }
    }

export const getUserCart = async(userId) => {

    let cart = await Cart.findOne({userId}).populate("items.productId").populate("items.variantId").populate("savedItems.productId").populate("savedItems.variantId")

        if(cart){
            
            const validItems = cart.items.filter(item => item.productId && item.productId.isListed && item.variantId && item.variantId.isListed)

            if(validItems.length !== cart.items.length){
                cart.items = validItems

                await cart.save()

        cart = await Cart.findOne({userId}).populate("items.productId").populate("items.variantId").populate("savedItems.productId").populate("savedItems.variantId")
            }
        }

        return cart
    }

export const updateCartItemQuantity = async (userId, data) =>{

        const {cartItemId, action} = data

        const cart = await Cart.findOne({userId})

        if(!cart){

            return {
                success: false
            }
        }

        const item = cart.items.id(cartItemId)

        if(!item){

            return {
                success: false
            }
        }

        const variant = await Variant.findById(item.variantId)

    if (!variant || !variant.isListed){

            return {
                success: false,
                message: "Variant unavailable"
            }
        }

        if(action === "increase") {

            if(item.quantity >= 5) {

                return {
                    success: false,
                    message:
                        "Maximum quantity reached"
                }
            }

            if(item.quantity >= variant.stock){

                return {
                    success: false,
                    message:
                        "Stock limit reached"
                }
            }

            item.quantity += 1
        }

        if(action === "decrease"){

            if(item.quantity > 1){
                item.quantity -= 1
            }
        }

        await cart.save()

        return {
            success: true
        }
    }

export const removeProductFromCart = async (userId, cartItemId) => {

    await Cart.updateOne(

        {userId},
        { $pull: {items: {_id: cartItemId}}}
    )}

export const saveItemForLater = async(userId, cartItemId) =>{

    const cart = await Cart.findOne({userId})

    if(!cart){
        return {success: false}
    }

    const item = cart.items.id(cartItemId)

    if(!item){
        return {success: false}
    }

    cart.savedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity
    })

    cart.items.pull(item._id)

    await cart.save()

    return {success: true}
}

export const moveToCart = async(userId, savedItemsId) =>{

    const cart = await Cart.findOne({userId})

    if(!cart){
        return{ success: false,
            message: "Cart not found"
        }
    }

    const item = cart.savedItems.id(savedItemsId)

    if(!item){
        return{
            success: false,
            message: "Item not found"
        }
    }

    const product = await Product.findById(item.productId)

    const variant = await Variant.findById(item.variantId)

    if(!product || !product.isListed || !variant || !variant.isListed){
        return {
            success: false,
            message: "Product unavailable"
        }
    }

    if(variant.stock <= 0){
        return{
            success: false,
            message: "Currently out of stock"
        }
    }
    const existingItem = cart.items.find(cartItem => cartItem.variantId.toString() === item.variantId.toString())

    if(existingItem){
        existingItem.quantity += item.quantity
    } else{

        cart.items.push({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity
        })
    }

    cart.savedItems.pull(item._id)

    await cart.save()

    return{
        success: true,
        message: "Product added to cart"
    }
}