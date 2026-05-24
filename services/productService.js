import Product from "../models/productModel.js"
import Variant from "../models/variantModel.js"
import Category from "../models/categoryModel.js"
import Brand from "../models/brandModel.js"

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
            variantName: color
        })

        const colorProductIds = variants.map(v => v.productId.toString())

        filteredProductIds = colorProductIds
    }

    if (minPrice || maxPrice) {

        let variantQuery = {}

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
            sortOption = {productName: 1}
            break
        case "z-a":
            sortOption = {productName: -1}
            break
        case "low-high":
            sortOption = "low-high"
            break
        case "high-low":
            sortOption = "high-low"
            break
    }

    const currentPage = Number(page) || 1

    const limit = 3

    const skip = (currentPage - 1) * limit


    let products = await Product.find(query).populate("brand").sort(typeof sortOption === "object" ? sortOption : {createdAt: -1}).lean()

    for (let product of products) {

        const firstVariant = await Variant.findOne({
            productId: product._id
        }).sort({createdAt: 1})

        product.variant = firstVariant
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

    const colors = await Variant.distinct("variantName")

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
        productId: product._id
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