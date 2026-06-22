import Product from "../models/productModel.js"
import Variant from "../models/variantModel.js"
import Category from "../models/categoryModel.js"
import Brand from "../models/brandModel.js"
import {uploadCloudinary} from "../utils/cloudinary.js"

export const getShopProducts = async (queryParams) => {

    const {
        search,
        sort,
        category,
        brand,
        color,
        minPrice,
        maxPrice,
        page
    } = queryParams

    let query = {isListed: true}

    let filteredProductIds = null

    if (search) {
        query.productName = {
            $regex: search,
            $options: "i"
        }
    }

    if (category) {
        query.category = category
    }

    if (brand) {
        query.brand = brand
    }

    if (color) {

        const variants = await Variant.find({
            variantName: color,
            isListed: true
        })

        const colorProductIds = variants.map(v => v.productId.toString())

        filteredProductIds = colorProductIds
    }

    if (minPrice || maxPrice) {

        let variantQuery = {
            isListed: true
        }

        if (minPrice) {

            variantQuery.salePrice = {
                ...variantQuery.salePrice,
                $gte: Number(minPrice)
            }
        }

        if (maxPrice) {
            variantQuery.salePrice = {

                ...variantQuery.salePrice,
                $lte: Number(maxPrice)
            }
        }

        const variants = await Variant.find(variantQuery)

        const priceProductIds = variants.map(v => v.productId.toString())

        if (filteredProductIds) {

            filteredProductIds = filteredProductIds.filter(id => priceProductIds.includes(id))
        } else {
            filteredProductIds = priceProductIds
        }
    }

    if (filteredProductIds) {
        query._id = {
            $in: filteredProductIds
        }
    }

    let sortOption = {createdAt: -1}

    switch (sort) {
        case "a-z":
            sortOption = "brand-a-z"
            break
        case "z-a":
            sortOption = "brand-z-a"
            break
        case "low-high":
            sortOption = "low-high"
            break
        case "high-low":
            sortOption = "high-low"
            break
    }

    const currentPage = Number(page) || 1

    const limit = 6

    const skip = (currentPage - 1) * limit


    let products = await Product.find(query).populate({path: "brand", match:{isListed: true}}).populate({path: "category", match:{isListed: true}}).collation({locale: "en", strength: 2}).sort(typeof sortOption === "object" ? sortOption : {createdAt: -1}).lean()

    products = products.filter( product => product.brand && product.category)

    for (let product of products) {

        const variants = await Variant.find({
            productId: product._id,
            isListed: true
        })

        product.variant = variants[0]

        product.isOutOfStock = variants.every(v => v.stock <=0)
    }

    products = products.filter(product => product.variant)

    if(sortOption === "brand-a-z"){
        products.sort((a,b) =>
            a.brand.name.localeCompare(b.brand.name)
        )
    }

    if(sortOption === "brand-z-a"){

        products.sort((a,b) =>
            b.brand.name.localeCompare(a.brand.name)
        )
    }

    if (sortOption === "low-high") {

        products.sort((a, b) =>
            (a.variant?.salePrice || 0) - (b.variant?.salePrice || 0))
    }
    if (sortOption === "high-low") {

        products.sort((a, b) =>
            (b.variant?.salePrice || 0) - (a.variant?.salePrice || 0))
    }

    const totalProduct = products.length

    const totalPages = Math.ceil(totalProduct / limit)

    const paginatedProducts = products.slice(skip, skip + limit)

    const categories = await Category.find({isListed: true})

    const brands = await Brand.find({isListed: true})

    const colors = await Variant.distinct("variantName", {isListed: true})

    return {
        products: paginatedProducts,
        categories,
        brands,
        colors,
        currentPage,
        totalPages
    }
}

export const getProductDetailsService = async (productId) => {

    const product = await Product.findById(productId).populate("brand").populate("category").lean()

    if (!product || !product.isListed) {
        return null
    }

    const variants = await Variant.find({
        productId: product._id,
        isListed: true
    })

    const relatedProducts = await Product.find({

        category: product.category._id,

        _id: {$ne: product._id},
        isListed: true
    }).limit(4)

    return {
        product,
        variants,
        similarProducts: relatedProducts
    }
}

export const createProduct = async (productData, file) => {

    const {
        productName,
        description,
        regularPrice,
        salePrice,
        playtime,
        brand,
        category
    } = productData

    const errors = {}

    if(!productName?.trim()){

        errors.productName = "Product name is required"
    }

    if(!description?.trim()){
        errors.description = "Description is required"
    }

    let isWired = false

    if(category){

        const selectedCategory = await Category.findById(category)

        isWired = selectedCategory?.name?.toLowerCase().includes("wired")
    }

    if(!isWired && !playtime?.trim()){

        errors.playtime = "Playtime is required"
    }

    if(!brand){
        errors.brand = "Brand is required"
    }

    if(!category){
        errors.category = "Category i s required"
    }

    if(!file){

        errors.productImage = "Product image is required"
    }

    if(Object.keys(errors).length > 0){

        return {
            success: false,
            errors
        }
    }

    const imageUrl = await uploadCloudinary(file.path)

    if(!imageUrl){

        return {
            success: false,
            errors: {
                productImage: "Cloudinary  upload failed"
            }
        }
    }

    const product = new Product({

        productName: productName.trim(),
        description: description.trim(),
        regularPrice,
        salePrice,
        playtime: playtime ? `${playtime} Hrs` : "",
        brand,
        category,
        productImage: [imageUrl]
    })

    await product.save()

    return {
        success: true,
        product
    }
}

export const updateProduct = async(productId, productData, file) =>{

    const{
        productName,
        description,
        playtime,
        brand,
        category
    } = productData

    const errors = {}

    if(!productName?.trim()){
        errors.productName = "Product name is required"
    }

    if(!description?.trim()){
        errors.description = "Description is required"
    }

    let isWired = false

    if (category) {

        const selectedCategory = await Category.findById(category)

        isWired =
            selectedCategory?.name?.toLowerCase().includes("wired")
    }

    if(!isWired && !playtime?.trim()){
        errors.playtime = "Playtime is required"
    }

    if(!brand){
        errors.brand = "Brans is required"
    }

    if(!category){
        errors.category = "Category is required"
    }

    const product = await Product.findById(productId)

    if(!product){

        return{
            success: true,
            notFound: true
        }
    }

    if(Object.keys(errors).length > 0){

        return{
            success: false,
            errors,
            product
        }
    }

    const updateData = {

        productName: productName.trim(),

        description: description.trim(),

        playtime: playtime ? `${playtime} Hrs` : "",
        brand,
        category
    }

    if(file){
        const imageUrl = await uploadCloudinary(file.path)

        if(imageUrl){
            updateData.productImage = [imageUrl]
        }
    }

    await Product.findByIdAndUpdate(productId, updateData)

    return{
        success: true
    }
}