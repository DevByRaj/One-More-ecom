import Wishlist from "../models/wishlistModel.js";
import Product from "../models/productModel.js"
import Variant from "../models/variantModel.js";


export const addToWiishlist = async(userId, data) =>{

    const{productId, variantId} = data

    const product = await Product.findById(productId)

    if(!product || !product.isListed){
        return {
            success: false,
            message: 'Product unavailable'
        }
    }

    const variant = await Variant.findById(variantId)

    if(!variant || !variant.isListed){
        return{
            success: false,
            message: "Variant unavailable"
        }
    }

    let wishlist = await Wishlist.findOne({userId})

    if(!wishlist){

        wishlist = new Wishlist({
            userId, 
            products: []
        })
    }

    const existingProduct = await wishlist.products.find( item => item.variantId.toString() === variantId)

    if(existingProduct){
        return{
            success: false,
            message: "Already in wishlist"
        }
    }

    wishlist.products.push({
        productId,
        variantId
    })

    await wishlist.save()

    return{
        success: true
    }
}

export const getWishlist = async(userId) =>{

    return await Wishlist.findOne({
        userId
    }).populate("products.productId").populate("products.variantId")
}

export const removeWishlistitem = async (userId, wishlistItemId) =>{

    await Wishlist.updateOne({userId}, {
        $pull:{
            products:{_id: wishlistItemId}
        }
    })
}
