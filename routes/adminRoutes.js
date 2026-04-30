import express from "express"
import { getAdminLogin, postAdminLogin, adminLogout } from "../controllers/adminontroller.js"
import { isAdminLoggedIn, isAdminLoggedOut } from "../middlewares/adminAuth.js"

const router = express.Router()

router.get("/login",isAdminLoggedOut, getAdminLogin)
router.post("/login",isAdminLoggedOut, postAdminLogin)

router.get("/logout", adminLogout)

router.get("/dashboard", isAdminLoggedIn, (req, res) =>{
    res.render("admin/dashboard")
})

export default router