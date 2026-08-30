import User from "../../models/userModel.js"
import Address from "../../models/addressModel.js"
import Category from "../../models/categoryModel.js"
import categoryModel from "../../models/categoryModel.js"
import Product from "../../models/productModel.js"
import Brand from "../../models/brandModel.js"
import {uploadCloudinary} from "../../utils/cloudinary.js";
import Variant from "../../models/variantModel.js"
import { createVariant, updateVariant } from "../../services/variantService.js"
import { createProduct, updateProduct } from "../../services/productService.js"
import { getBestSellingProductsService, getBestSellingCategoriesService, getBestSellingBrandsService } from "../../services/salesReportService.js"

export const getAdminLogin = (req, res) => {
  res.render("admin/login", {error: null})
}

export const postAdminLogin = (req, res) => {
  const {email, password} = req.body

  if (!email || !password) {
    return res.render("admin/login", {
      error: "All fields are required"
    })
  }

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    req.session.admin = true
    return res.redirect("/admin/dashboard")
  }

  return res.render("admin/login", {
    error: "Invalid email or password"
  })
}

export const adminLogout = (req, res) => {

  req.session.admin = null
  res.redirect("/admin/login")
}

export const getUsers = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1
    const limit = 6
    const skip = (page - 1) * limit

    const search = (req.query.search || "").trim()
    const status = req.query.status || ""

    let query = {}

    if (search) {
      query.$or = [
        {name: {$regex: search, $options: "i"}},
        {email: {$regex: search, $options: "i"}}
      ]
    }
    if (status === "blocked") {
      query.isBlocked = true;
    } else if (status === "active") {
      query.isBlocked = false
    }

    const totalUsers = await User.countDocuments(query)

    const users = await User.find(query).sort({createdAt: -1}).skip(skip).limit(limit).lean()

    for (let user of users) {
      const address = await Address.findOne({userId: user._id, isDefault: true})

      user.address = address ? `${address.houseName}, ${address.city}` : "No Address"
    }

    //   console.log("USERS:", users);

    const totalPages = Math.ceil(totalUsers / limit)

    res.render("admin/users", {
      users,
      currentPage: page,
      totalPages,
      search,
      status
    })

  } catch (error) {

    console.log(error)

    res.render("admin/users", {
      users: [],
      currentPage: 1,
      totalPages: 1,
      search: "",
      error: "Faild to load User"
    })
  }
}

export const toggleUserBlock = async (req, res) => {
  try {
    const userId = req.params.id

    const user = await User.findById(userId)

    if (!user) {
      return res.redirect("/admin/users")
    }

    user.isBlocked = !user.isBlocked

    await user.save()

    res.redirect("/admin/users")

  } catch (error) {
    console.log(error);

    res.redirect("/admin/users")

  }
}

export const getCategory = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1
    const limit = 5
    const skip = (page - 1) * limit

    const search = (req.query.search || "").trim()

    let query = {}

    if (search) {
      query.name = {
        $regex: search,
        $options: "i"
      }
    }

    const totalCategories = await Category.countDocuments(query)

    const categories = await Category.find(query).sort({createdAt: -1}).skip(skip).limit(limit).lean()

    const totalPages = Math.ceil(totalCategories / limit)

    return res.render("admin/category", {
      categories,
      currentPage: page,
      totalPages,
      search
    })

  } catch (error) {

    console.log(error)

    return res.render("admin/category", {
      categories: [],
      currentPage: 1,
      totalPages: 1,
      search: "",
      error: "Failed to load categories"
    })

  }
}

export const getAddCategory = (req, res) => {
  res.render("admin/addCategory", {
    category: null,
    error: null
  })
}

export const postAddCategory = async (req, res) => {
  try {
    let {name} = req.body

    name = name.trim()

    if (!name) {
      return res.render("admin/addCategory", {
        category: null,
        error: "Category name is required"
      })
    }

    const existingCategory = await Category.findOne({
      name: {
        $regex: `^${name}$`,
        $options: "i"
      }
    })

    if (existingCategory) {
      return res.render("admin/addCategory", {
        category: null,
        error: "Category already exist"
      })
    }

    const category = new Category({
      name
    })

    await category.save()

    return res.redirect("/admin/category")

  } catch (error) {
    console.log(error)

    return res.render("admin/addCategory", {
      category: null,
      error: "Failed tto add category"
    })
  }
}

export const toggleCategoryStatus = async (req, res) => {
  try {
    const categoryId = req.query.id

    const category = await Category.findById(categoryId)

    if (!category) {
      return res.redirect("/admin/category")
    }

    category.isListed = !category.isListed

    await category.save()

    return res.redirect("/admin/category")

  } catch (error) {
    console.log(error)

    return res.redirect("/admin/category")

  }
}

export const getEditCategory = async (req, res) => {
  try {

    const category = await Category.findById(req.query.id)

    if (!category) {
      return res.redirect("/admin/category")
    }

    return res.render("admin/addCategory", {
      category,
      error: null
    })

  } catch (error) {

    console.log(error)

    return res.redirect("/admin/category")

  }
}

export const postEditCategory = async (req, res) => {
  try {

    const categoryId = req.query.id

    let {name} = req.body

    name = name.trim()

    if (!name) {

      return res.render("admin/addCategory", {
        error: "Category name is required",
        category: {
          _id: categoryId,
          name
        }
      })
    }
    const existingCategory = await Category.findOne({
      _id: {$ne: categoryId},
      name: {
        $regex: `^${name}$`,
        $options: "i"
      }
    })

    if (existingCategory) {
      return res.render("admin/addCategory", {
        error: "Category already exists",
        category: {
          _id: categoryId,
          name
        }
      })
    }

    await Category.findByIdAndUpdate(categoryId, {
      name
    })

    return res.redirect("/admin/category")

  } catch (error) {
    console.log(error)

    return res.redirect("/admin/category")

  }
}

export const getBrand = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1

    const limit = 5

    const skip = (page - 1) * limit

    const search = (req.query.search || "").trim()

    let query = {}

    if (search) {
      query.name = {
        $regex: search,
        $options: "i"
      }
    }

    const totalBrands = await Brand.countDocuments(query)

    const brands = await Brand.find(query).sort({createdAt: -1}).skip(skip).limit(limit).lean()

    const totalPages = Math.ceil(totalBrands / limit)

    return res.render("admin/brand", {
      brands,
      currentPage: page,
      totalPages,
      search
    })

  } catch (error) {
    console.log(error)

    return res.render("admin/brand", {
      brands: [],
      currentPage: 1,
      totalPages: 1,
      search: "",
      error: "Failed to loaf brands"
    })
  }
}

export const getAddBrand = (req, res) => {

  return res.render("admin/addBrand", {
    brand: null,
    error: null
  })
}

export const postAddBrand = async (req, res) => {
  try {

    let {name} = req.body

    name = name?.trim()

    if (!name) {

      return res.render("admin/addBrand", {
        brand: null,
        error: "brand name is required"
      })
    }

    const existingBrand = await Brand.findOne({
      name: {
        $regex: `^${name}$`,
        $options: "i"
      }
    })

    if (existingBrand) {

      return res.render("admin/addBrand", {
        brand: null,
        error: "Brand already exists"
      })
    }

    const brand = new Brand({
      name
    })

    await brand.save()

    return res.redirect("/admin/brand")

  } catch (error) {
    console.log(error)

    return res.render("admin/addBrand", {
      brand: null,
      error: "Failed to add brand"
    })
  }
}

export const getEditBrand = async (req, res) => {
  try {

    const brand = await Brand.findById(req.query.id)

    if (!brand) {
      return res.redirect("/admin/brand")
    }

    return res.render("admin/addBrand", {
      brand,
      error: null
    })

  } catch (error) {
    console.log(error)

    return res.redirect("/admin/brand")

  }
}

export const postEditBrand = async (req, res) => {
  try {

    const brandId = req.query.id
    let {name} = req.body

    name = name.trim()

    if (!name) {

      return res.render("admin/addBrand", {
        error: "Brand name Required",
        brand: {
          _id: brandId,
          name
        }
      })
    }

    const existingBrand = await Brand.findOne({
      _id: {$ne: brandId},
      name: {
        $regex: `^${name}$`,
        $options: "i"
      }
    })

    if (existingBrand) {

      return res.render("admin/addBrand", {
        error: "Brand aleady exists",
        brand: {
          _id: brandId,
          name
        }
      })
    }

    await Brand.findByIdAndUpdate(brandId, {
      name
    })

    return res.redirect(("/admin/brand"))

  } catch (error) {
    console.log(error);

    return res.redirect("/admin/brand")


  }
}

export const toggleBrand = async (req, res) => {
  try {

    const brandId = req.query.id

    const brand = await Brand.findById(brandId)

    if (!brand) {
      return res.redirect("/admin/brand")
    }

    brand.isListed = !brand.isListed

    await brand.save()

    return res.redirect("/admin/brand")

  } catch (error) {
    console.log(error);

    return res.redirect("/admin/brand")

  }
}

export const getProducts = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1

    const limit = 4

    const skip = (page - 1) * limit

    const search = (req.query.search || "").trim()

    const status = req.query.status || ""

    let query = {}

    if (status === "active") {
      query.isListed = true
    }
    else if (status === "blocked") {
      query.isListed = false
    }

    if (search) {

      query.productName = {
        $regex: search,
        $options: "i"
      }
    }

    const totalProducts = await Product.countDocuments(query)

    const products = await Product.find(query).populate("category").populate("brand").sort({createdAt: -1}).skip(skip).limit(limit).lean()

    for(const product of products){

      const variants = await Variant.find({
        productId: product._id
      })
            

      const totalStock = variants.reduce(
        (total, variant) => total + variant.stock, 0
      )

      product.totalStock = totalStock

      if(totalStock === 0){
        product.stockStatus = "Out of Stock"
      } else if(totalStock <= 5){
        product.stockStatus = "Low Stock"
      } else{
        product.stockStatus = "In Stock"
      }
    }

    const totalPages = Math.ceil(totalProducts / limit)

    return res.render("admin/products", {
      products,
      currentPage: page,
      totalPages,
      search,
      status
    })

  } catch (error) {
    console.log(error)

    return res.render("admin/products", {
      products: [],
      currentPage: 1,
      totalPages: 1,
      search: "",
      status: "",
      error: "Faild to load products"
    })

  }
}

export const getAddProduct = async (req, res) => {
  try {

    const categories = await Category.find({
      isListed: true
    }).sort({name: 1})

    const brands = await Brand.find({
      isListed: true
    }).sort({name: 1})

    return res.render("admin/addProduct", {
      categories,
      brands,
      errors: {},
      oldData: {},
      isEdit: false
    })

  } catch (error) {
    console.log(error)

    return res.redirect("/admin/product")

  }
}

export const postAddProduct = async (req, res) => {
  try {
     const categories = await Category.find({
      isListed:  true
     })

    const brands =
      await Brand.find({
        isListed: true
      })

    const result =
      await createProduct(
        req.body,
        req.file
      )

    if (!result.success) {

      return res.render(
        "admin/addProduct",
        {
          errors: result.errors,
          oldData: req.body,
          categories,
          brands,
          isEdit: false
        }
      )
    }

    return res.redirect(`/admin/variants/${result.product._id}`
    )

  } catch (error) {
    console.log(error)

    return res.redirect("/admin/add-product")
    
  }
}

export const toggleProduct = async (req, res) => {
  try {

    const productId = req.query.id

    const product = await Product.findById(productId)

    if (!product) {
      return res.redirect("/admin/products")
    }

    await Product.findByIdAndUpdate(productId, {
      isListed: !product.isListed
    })

    return res.redirect("/admin/products")

  } catch (error) {
    console.log(error)

    return res.redirect("/admin/products")

  }
}

export const getEditProduct = async (req, res) => {
  try {

    const productId = req.params.id

    const product = await Product.findById(productId)

    const categories = await Category.find({
      isListed: true
    })

    const brands = await Brand.find({
      isListed: true
    })

    if (!product) {
      return res.redirect("/admin/products")
    }

    return res.render("admin/addProduct", {
      product,
      categories,
      brands,
      errors: {},
      oldData: product,
      isEdit: true
    })

  } catch (error) {
    console.log(error)

    return res.redirect("/admin/products")

  }
}

export const postEditProduct = async (req, res) =>{
  try {
    const productId = req.params.id

    const categories = await Category.find({
      isListed: true
    })

    const brands = await Brand.find({
      isListed:true
    })

    const result = await updateProduct(
      productId,
      req.body,
      req.file
    )

    if(!result.success){

      if(result.notFound){
        
        return res.redirect("/admin/products")
      }

      return res.render("admin/addProduct",{
          errors: result.errors,
          oldData: req.body,
          categories,
          brands,
          isEdit: true,
          product: result.product
        })
    }
    return res.redirect("/admin/products")

  } catch (error) {
    console.log(error)

    return res.redirect("/admin/products")
    
  }
}

export const getVariants = async (req, res) => {
  try {

    const {productId} = req.params

    const variants = await Variant.find({
      productId
    })
      .populate("productId")
      .sort({createdAt: -1})
      .lean()

    return res.render("admin/variantList", {
      variants,
      productId
    })

  } catch (error) {
    console.log(error)

    return res.redirect("/admin/dashboard")

  }
}

export const getAddVariant = async (req, res) => {
  try {

    const {productId} = req.params

    return res.render("admin/addVariants", {
      productId,
      variant: null,
      errors: {},
      oldData: {}
    })

  } catch (error) {
    console.log(error);

    return res.redirect("/admin/products")

  }
}

export const postAddVariant = async (req, res) => {
  try {

    const result = await createVariant(
      req.body,
      req.files
    )
    
    if(!result.success){
      return res.render(
        "admin/addVariants",{
          errors: result.errors,
          oldData: req.body,
          productId: req.body.productId,
          variant: null
        }
      )
    }

    return res.redirect(`/admin/variants/${req.body.productId}`)
    
  } catch (error) {
    console.log(error)

    return res.redirect("/admin/add-variant")
    
  }
}

export const toggleVariantStatus = async (req, res) => {
  try {

    const {id} = req.params

    const variant = await Variant.findById(id)

    if (!variant) {
      return res.redirect("/admin/products")
    }
    variant.isListed = !variant.isListed

    await variant.save()

    return res.redirect(`/admin/variants/${variant.productId}`)

  } catch (error) {
    console.log(error)

    return res.redirect("/admin/products")

  }
}

export const getEditVariant = async (req, res) => {
  try {

    const {id} = req.params

    const variantData = await Variant.findById(id).lean()

    if (!variantData) {

      return res.redirect("/admin/products")
    }

    return res.render("admin/addVariants", {
      variant: variantData,
      productId: variantData.productId,
      errors: {},
      oldData: {}
    })

  } catch (error) {

    console.log(error)

    return res.redirect("/admin/products")

  }
}

export const postEditVariant = async (req,res) => {
  try {

    const result =
      await updateVariant(
        req.params.id,
        req.body,
        req.files
      )

    if(result.notFound){
      return res.redirect("/admin/products")
    }

    if(!result.success){
      return res.render("admin/addVariants",
        {
          errors: result.errors,
          variant: {
            ...result.variant.toObject(),
            variantName:req.body.color,
            stock: req.body.stock,

            regularPrice: req.body.regularPrice,

            salePrice: req.body.salePrice
          },
          productId:result.variant.productId
        }
      )
    }

    return res.redirect(`/admin/variants/${result.productId}`)

  } catch (error) {
    console.log(error)

    return res.redirect("/admin/products")
  }
}

export const getBestSellingProducts = async (req, res) => {
  try {

    const page = Number(req.query.page) || 1
    const limit = 10

    const result = await getBestSellingProductsService(
      page,
      limit
    )

    return res.render("admin/bestSellingProducts", {
      products: result.products,
      currentPage: result.currentPage,
      totalPages: result.totalPages
    })

  } catch (error) {

    console.log(error)

    return res.redirect("/admin/dashboard")
  }
}

export const getBestSellingCategories = async (req, res) => {
  try {

    const page = Number(req.query.page) || 1
    const limit = 10

    const result = await getBestSellingCategoriesService(
      page,
      limit
    )

    return res.render("admin/bestSellingCategories", {
      categories: result.categories,
      currentPage: result.currentPage,
      totalPages: result.totalPages
    })

  } catch (error) {

    console.log(error)

    return res.redirect("/admin/dashboard")
  }
}

export const getBestSellingBrands = async (req, res) => {
  try {

    const page = Number(req.query.page) || 1
    const limit = 10

    const result = await getBestSellingBrandsService(
      page,
      limit
    )

    return res.render("admin/bestSellingBrands", {
      brands: result.brands,
      currentPage: result.currentPage,
      totalPages: result.totalPages
    })

  } catch (error) {

    console.log(error)

    return res.redirect("/admin/dashboard")
  }
}