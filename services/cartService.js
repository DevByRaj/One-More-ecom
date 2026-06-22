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

        let cart = await Cart.findOne({userId}).populate("items.productId").populate("items.variantId")

        if(cart){
            
            const validItems = cart.items.filter(item => item.productId && item.productId.isListed && item.variantId && item.variantId.isListed)

            if(validItems.length !== cart.items.length){
                cart.items = validItems

                await cart.save()

                cart = await Cart.findOne({userId}).populate("items.productId").populate("items.variantId")
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