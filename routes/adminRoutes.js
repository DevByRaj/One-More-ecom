import express from "express"
import { getAdminLogin, postAdminLogin,
     adminLogout,
     getUsers,
     toggleUserBlock,
     getCategory,
     getAddCategory, postAddCategory,
     toggleCategoryStatus,
     getEditCategory, postEditCategory } from "../controllers/adminController.js"
import { isAdminLoggedIn, isAdminLoggedOut } from "../middlewares/adminAuth.js"


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

export default router