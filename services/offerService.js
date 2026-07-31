import ProductOffer from "../models/productOfferModel.js"
import Product from "../models/productModel.js"

export const getProductOfferListService = async() =>{
    try {

        const productOffers = (await ProductOffer.find().populate("productId")).toSorted({createAt: -1})

        return{
            success: true,
            productOffers
        }
        
    } catch (error) {
        console.log(error);
        
        return{
            success: false,
            message: "Failed to fetch product offers"
        }
    }

}

export const getAddProductOfferService = async() =>{

}

export const addProductOfferService = async() =>{

}

export const getEditProductOfferSrvice = async() =>{

}

export const updateProductOfferService = async() =>{

}

export const deleteProductOfferService = async(offerId) =>{

}