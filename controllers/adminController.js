import User from "../models/userModel.js"
import Address from "../models/addressModel.js"
import Category from "../models/categoryModel.js"
import categoryModel from "../models/categoryModel.js"
import Product from "../models/productModel.js"

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

export const getAddCategory = (req, res) =>{
  res.render("admin/addCategory", {
     category: null,
    error: null
  })
}

export const postAddCategory = async(req, res) =>{
  try {
    let {name} = req.body

    name = name.trim()

    if(!name){
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

    if(existingCategory){
      return res.render("admin/addCategory", {
        category: null,
        error: "Category already exist"
      })
    }

    const category = new Category({
      name,
      description
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

export const toggleCategoryStatus = async (req, res) =>{
  try {
    const categoryId = req.query.id
    
    const category = await Category.findById(categoryId)

    if(!category){
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

export const getEditCategory = async (req, res) =>{
  try {
   
    const category = await Category.findById(req.query .id)

    if(!category){
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

export const postEditCategory = async(req, res) =>{
  try {

    const categoryId = req.query.id

    let {name} = req.body

    name = name.trim()

    if(!name){

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

    if(existingCategory){
      return res.render("admin/addCategory",{
        error: "Category already exists",
        category:{
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

export const getProducts = async (req, res) =>{
  try {

    const page = parseInt(req.query.page) || 1

    const limit = 5

    const skip = (page - 1)* limit
    
    const search = (req.query.search || "").trim()

    let query = {}

    if(search){

      query.productName = {
        $regex: search,
        $option: "i"
      }
    }

    const totalProducts = await Product.countDocuments(query)

    const products = (await Product.find(query).populate("category")).toSorted({createdAt: -1}).skip(skip).limit(limit).lean()

    const totalPages = Math.ceil(totalProducts/limit)

    return res.render("admin/products", {
      products,
      currentpage: page,
      totalPages,
      search
    })
    
  } catch (error) {
    console.log(error)

    return res.render("admin/products", {
      products: [],
      currentPage: 1,
      totalPages: 1,
      search: "",
      error: "Faild to load products"
    })
    
  }
}