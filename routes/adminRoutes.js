import express from "express"
import {
    getAdminLogin, postAdminLogin,
    adminLogout,
    getUsers,
    toggleUserBlock,
    getCategory,
    getAddCategory, postAddCategory,
    toggleCategoryStatus,
    getEditCategory, postEditCategory,
    getBrand, getAddBrand, postAddBrand,
    toggleBrand,
    getEditBrand, postEditBrand,
    getProducts, getAddProduct, postAddProduct, getEditProduct, postEditProduct,
    toggleProduct
} from "../controllers/adminController.js"
import {isAdminLoggedIn, isAdminLoggedOut} from "../middlewares/adminAuth.js"
import upload from "../middlewares/multer.js"


const router = express.Router()

router.get("/login", isAdminLoggedOut, getAdminLogin)
router.post("/login", isAdminLoggedOut, postAdminLogin)

router.get("/logout", adminLogout)

router.get("/dashboard", isAdminLoggedIn, (req, res) => {
    res.render("admin/dashboard")
})

router.get("/users", isAdminLoggedIn, getUsers)

router.post("/users/toggle-block/:id", isAdminLoggedIn, toggleUserBlock)

router.get("/category", isAdminLoggedIn, getCategory)

router.get("/addCategory", isAdminLoggedIn, getAddCategory)
router.post("/addCategory", isAdminLoggedIn, postAddCategory)

router.post("/listCategory", isAdminLoggedIn, toggleCategoryStatus)

router.get("/editCategory", isAdminLoggedIn, getEditCategory)
router.post("/editCategory", isAdminLoggedIn, postEditCategory)

router.get("/brand", isAdminLoggedIn, getBrand)

router.get("/addBrand", isAdminLoggedIn, getAddBrand)
router.post("/addBrand", isAdminLoggedIn, postAddBrand)

router.get("/listbrand", isAdminLoggedIn, toggleBrand)

router.get("/editBrand", isAdminLoggedIn, getEditBrand)
router.post("/editBrand", isAdminLoggedIn, postEditBrand)

router.get("/products", isAdminLoggedIn, getProducts)

router.get("/add-product", isAdminLoggedIn, getAddProduct)
router.post("/add-product", isAdminLoggedIn, upload.single("productImage"), postAddProduct)

router.get("/toggle-product", isAdminLoggedIn, toggleProduct)

router.get("/edit-product/:id", isAdminLoggedIn, getEditProduct)
router.post("/edit-product/:id", isAdminLoggedIn, upload.single("productImage"), postEditProduct)




export default router