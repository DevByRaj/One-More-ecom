import express from "express"
import { getAdminLogin, postAdminLogin, adminLogout } from "../controllers/adminController.js"
import { isAdminLoggedIn, isAdminLoggedOut } from "../middlewares/adminAuth.js"
import { getUsers } from "../controllers/adminController.js"
import { toggleUserBlock } from "../controllers/adminController.js"


const router = express.Router()

router.get("/login", isAdminLoggedOut, getAdminLogin)
router.post("/login", isAdminLoggedOut, postAdminLogin)

router.get("/logout", adminLogout)

router.get("/dashboard", isAdminLoggedIn, (req, res) => {
    res.render("admin/dashboard")
})

router.get("/users", isAdminLoggedIn, getUsers)

router.post("/users/toggle-block/:id", isAdminLoggedIn, toggleUserBlock)



export default router