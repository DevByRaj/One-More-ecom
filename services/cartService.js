import Cart from "../models/cartModel.js"
import Product from "../models/productModel.js"
import Variant from "../models/variantModel.js"
import Wishlist from "../models/wishlistModel.js"
import { FREE_SHIPPING_LIMIT, SHIPPING_CHARGE } from "../config/appConfig.js"

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

        let savedItem = cart.savedItems.find(item => item.variantId.toString() === variantId)

        if(savedItem){
            cart.savedItems.pull(savedItem._id)
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

    const result = await Wishlist.updateOne(
        {userId},
        {
            $pull: {
                products: {
                    productId,
                    variantId
                }
            }
        }
    );
    
    const wishlist = await Wishlist.findOne({userId});

    return {
        success: true,
        cartCount: cart.items.length,
        wishlistCount: wishlist ? wishlist.products.length : 0
    };
    }

export const getUserCart = async(userId) => {

    let cart = await Cart.findOne({userId}).populate({path: "items.productId", populate:[{path: "brand"}, {path: "category"}]}).populate("items.variantId").populate("savedItems.productId").populate("savedItems.variantId")

        if(cart){
            
            const validItems = cart.items.filter(item => item.productId && item.productId.isListed && 
                item.productId.brand && item.productId.brand.isListed &&
                item.productId.category && item.productId.category.isListed &&
                item.variantId && item.variantId.isListed)

            if(validItems.length !== cart.items.length){
                cart.items = validItems

                await cart.save()

        cart = await Cart.findOne({userId}).populate({path:"items.productId", populate:[{path: "brand"}, {path: "category"}]}).populate("items.variantId").populate({path:"savedItems.productId", populate: [{path: "brand"}, {path: "category"}]}).populate("savedItems.variantId")
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

export const calculateCartTotals = (cart) =>{

    let subtotal = 0

    if(!cart || !cart.items){
        return{
            subtotal: 0,
            shipping: 0,
            discount: 0,
            grandTotal: 0
        }
    }

    cart.items.forEach(item =>{
        if(
            item.productId && 
            item.variantId &&
            item.productId.isListed &&
            item.variantId.isListed
        ) {
            subtotal += item.variantId.salePrice * item.quantity
        }
    })

    let shipping = 0

    if(subtotal  > 0 && subtotal < FREE_SHIPPING_LIMIT){
        shipping = SHIPPING_CHARGE
    }
    
    const grandTotal = subtotal + shipping

    return{
        subtotal,
        shipping,
        discount: 0,
        grandTotal
    }
}