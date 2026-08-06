import Offer from "../models/offerModel.js";

export const calculateBestOffer = async(product, variant) =>{
    try {

        const currentDate = new Date()       

        const  productOffer = await Offer.findOne({
            appliesTo: "PRODUCT",
            productId: product._id,
            isActive: true,
            startDate: {$lte: currentDate},
            endDate: {$gte: currentDate}
        })

        const categoryOffer = await Offer.findOne({
            appliesTo: "CATEGORY",
            categoryId: product.category,
            isActive: true,
            startDate: {$lte: currentDate},
            endDate: {$gte: currentDate}
        })

        let bestOffer = null

        let highestDiscount = 0

        if(productOffer){

            let discount = 0

            if( productOffer.offerType === "PERCENTAGE"){
                discount = (variant.regularPrice * productOffer.discountValue) / 100
            } else{
                discount = productOffer.discountValue
            }

            highestDiscount = discount
            bestOffer = productOffer
        }

        if(categoryOffer){

            let discount = 0
            
            if(categoryOffer.offerType === "PERCENTAGE"){

                discount = (variant.regularPrice * categoryOffer.discountValue) / 100
            } else{
                discount = categoryOffer.discountValue
            }

            if(discount > highestDiscount){

                highestDiscount = discount
                bestOffer = categoryOffer
            }
        }

        const originalPrice = variant.regularPrice

        const finalPrice = Math.max(
            originalPrice - highestDiscount, 0
        )

        const discountAmount = originalPrice - finalPrice

        return{
            originalPrice,
            finalPrice,
            discountAmount,
            appliedOffer: bestOffer
        }
        
    } catch (error) {
        console.log(error);
        
        return {
            originalPrice: variant.salePrice,
            finalPrice: variant.salePrice,
            discountAmount: 0,
            appliedOffer: null
        }
    }
}