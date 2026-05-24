import Variant from "../models/variantModel.js"

import {uploadCloudinary} from "../utils/cloudinary.js"

export const createVariant = async (
    variantData,
    files
) => {

    const {
        productId,
        color,
        stock,
        regularPrice
    } = variantData

    let {salePrice} = variantData

    const errors = {}

    if (!color || color.trim() === "") {

        errors.color =
            "Color is required"
    }

    if (!stock || stock <= 0) {

        errors.stock =
            "Stock must be greater than 0"
    }

    if (!regularPrice || regularPrice <= 0) {

        errors.regularPrice =
            "Regular price is required"
    }

    if (!salePrice || salePrice === "") {

        salePrice = regularPrice
    }

    const imageUrls = []

    for (let i = 0; i < 3; i++) {

        const fieldName =
            `variantImage${i}`

        const file =
            files[fieldName]?.[0]

        if (file) {

            const imageUrl =
                await uploadCloudinary(file.path)

            if (imageUrl) {

                imageUrls[i] = imageUrl
            }
        }
    }

    const hasImage =
        imageUrls.some(image => image)

    if (!hasImage) {

        errors.variantImage =
            "Please upload at least one image"
    }

    if (Object.keys(errors).length > 0) {

        return {
            success: false,
            errors
        }
    }

    const cleanedImages =
        imageUrls.map(image => image || "")

    const variant = new Variant({

        productId,

        variantName: color,

        regularPrice,

        salePrice,

        stock,

        sku: "SKU-" + Date.now(),

        variantImage: cleanedImages
    })

    await variant.save()

    return {

        success: true,

        variant
    }
}

export const updateVariant = async (
    variantId,
    variantData,
    files
) => {
    const {
        color,
        stock,
        regularPrice
    } = variantData

    let {salePrice} = variantData

    const errors = {}

    if (!color || color.trim() === "") {
        errors.color = "Color is required"
    }

    if (!stock || stock <= 0) {
        errors.stock = "Stock must be greater than 0"
    }

    if(!regularPrice || regularPrice <= 0){
        errors.regularPrice = "Regular price is required"
    }

    const variant = await Variant.findById(variantId)

    if(!variant){

        return {
            success: false,
            notFound: true
        }
    }

    if(!salePrice || salePrice === ""){
        salePrice = regularPrice
    }

    if(Object.keys(errors).length > 0){

        return {
            success: false,
            errors,
            variant
        }
    }

    let imageUrls = [...variant.variantImage]

    for(let i=0; i<3; i++){

        const fieldName = `variantImage${i}`

        const file =
            files[fieldName]?.[0]

        if(file){
            const uploadedImage =
                await uploadCloudinary(file.path)

            if(uploadedImage){
                imageUrls[i] = uploadedImage
            }
        }
    }


    await Variant.findByIdAndUpdate(
        variantId,
        {
            variantName: color,
            stock,
            regularPrice,
            salePrice,
            variantImage: imageUrls
        }
    )

    return{
        success: true,
        productId: variant.productId
    }
}