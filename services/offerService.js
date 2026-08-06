import Offer from "../models/offerModel.js"
import Product from "../models/productModel.js"
import Category from "../models/categoryModel.js"

export const getOfferListService = async(page, limit) =>{
    try{

        const skip = (page - 1)* limit
        const offers = await Offer.find().populate("productId").populate("categoryId").sort({createdAt: -1})
        .skip(skip).limit(limit)

        const totalOffers = await Offer.countDocuments()

        return{
            success: true,
            offers,
            currentPage: page,
            totalPages: Math.ceil(totalOffers/limit)
        }
    } catch(error){
        console.log(error);
        
        return{
            success: false,
            message: "Failed to fetch offers."
        }
    }
}

export const getAddOfferService = async () => {
    try {

        const products = await Product.find({
            isListed: true
        }).sort({productName: 1})

        const categories = await Category.find({
            isListed: true
        }).sort({name: 1})

        return{
            success: true,
            products,
            categories
        }
        
    } catch (error) {
        console.log(error);
        
        return{
            success: false,
            message: "Failed to load offer page."
        }
    }

}

export const addOfferService = async (formData) => {

    try{

    const {
        offerName,
        appliesTo,
        productId,
        categoryId,
        offerType,
        discountValue,
        startDate,
        endDate,
        isActive
    } = formData


    if(!offerName || !offerName.trim()){
        return{
            success: false,
            message: "Offer name is required"
        }
    }

    if(!["PRODUCT", "CATEGORY"]. includes(appliesTo)){
        return{
            success: false,
            message: "Invalid offer target"
        }
    }

    if(appliesTo === "PRODUCT" && !productId){
        return{
            success: false,
            message: "Please select a product"
        }
    }

    if(appliesTo === "CATEGORY" && !categoryId){
        return{
            success: false,
            message: "Please select a category"
        }
    }

    if(!["PERCENTAGE","FLAT"].includes(offerType)){
        return{
            success: false,
            message: "Invalid discount type"
        }
    }

    if(!discountValue || Number(discountValue) <= 0){
        return{
            success: false,
            message: "Discount value must be greater than zero"
        }
    }

    if(
        offerType === "PERCENTAGE" &&
        Number(discountValue) > 100
    ){
        return{
            success: false,
            message: "Percentage discount cannot exceed 100%"
        }
    }

    if(!startDate || !endDate){
        return{
            success: false,
            message: "Start date and end date are required"
        }
    }

    if(new Date(startDate) >= new Date(endDate)){
        return{
            success: false,
            message: "End date must be after start date"
        }
    }

    const activeStatus = !!isActive

    if(activeStatus){

        let existingOffer

        if(appliesTo === "PRODUCT"){

            existingOffer = await Offer.findOne({
                appliesTo: "PRODUCT",
                productId,
                isActive: true
            })
        } else{
            existingOffer = await Offer.findOne({
                appliesTo: "CATEGORY",
                categoryId,
                isActive: true
            })
        }

        if(existingOffer){
            return{
                success: false,
                message: `${appliesTo === "PRODUCT" ? "Product" : "Category"} already has an active offer`
            }
        }

    }

    await Offer.create({
        offerName: offerName.trim(),
        appliesTo,
        productId: appliesTo === "PRODUCT" ? productId : null,
        categoryId: appliesTo === "CATEGORY" ? categoryId : null,
        offerType,
        discountValue: Number(discountValue),
        startDate,
        endDate,
        isActive: activeStatus
    })

    return {
        success: true,
        message: "Offer added successfully"
    }
} catch(error){
    console.log(error);
    
    return{
        success: false,
        message: "Failed to add offer"
    }
}
}

export const getEditOfferService = async (offerId) => {
    try {
        const  offer = await Offer.findById(offerId)

        if(!offer){
            return{
                success: false,
                message: "Offer not found"
            }
        }

        const products = await Product.find({
            isListed: true
        }).sort({productName: 1})

        const categories = await Category.find({
            isListed: true
        }).sort({name: 1})

        return{
            success: true,
            offer,
            products,
            categories
        }

    } catch (error) {
        console.log(error);
        
        return{
            success: false,
            message: "Failed to load offer"
        }
        
    }

}

export const updateOfferService = async (offerId, formData) => {
    try {

        const{
            offerName,
            appliesTo,
            productId,
            categoryId,
            offerType,
            discountValue,
            startDate,
            endDate,
            isActive
        } = formData

        const offer = await Offer.findById(offerId)

        if(!offer){
            return {
                success: false,
                message: "Offer not found"
            }
        }

        const activeStatus = !!isActive

        if(activeStatus){

            let existingOffer

            if(appliesTo === "PRODUCT"){

                existingOffer = await Offer.findOne({
                    _id:{$ne: offerId},
                    appliesTo: "PRODUCT",
                    productId,
                    isActive: true
                })
            } else{

                existingOffer = await Offer.findOne({
                    _id: {$ne: offerId},
                    appliesTo: "CATEGORY",
                    categoryId,
                    isActive: true
                })
            }

            if(existingOffer){
                return{
                    success: false,
                    message: `${appliesTo === "PRODUCT" ? "Product" : "Category"} already has an active offer`
                }
            }
        }

        offer.offerName = offerName.trim()
        offer.appliesTo = appliesTo
        offer.productId = appliesTo === "PRODUCT" ? productId : null
        offer.categoryId = appliesTo ===  "CATEGORY" ? categoryId: null
        offer.offerType = offerType
        offer.discountValue = Number(discountValue)
        offer.startDate = startDate
        offer.endDate = endDate
        offer.isActive = activeStatus

        await offer.save()

        return{
            success: true,
            message: "Offer updated successfully"
        }
        
    } catch (error) {

        console.log(error);
        
        return {
            success: false,
            message: "Failed to update offer"
        }
        
    }

}

export const deleteOfferService = async (offerId) => {
    try {

        const offer = await Offer.findById(offerId)

        if(!offer){
            return{
                success: false,
                message: "Offer not found"
            }
        }

        await Offer.findByIdAndDelete(offerId)

        return{
            success: true,
            message: "Offer deleted successfully"
        }
        
    } catch (error) {
        console.log(error);
        
         return{
            success: false,
             message: "Failed to delete Offer"
         }
        
    }

}