import express from "express";
import { getHome,
        getLogin, postLogin,
        getSignup, postSignup, 
        getLogout,
        getProfile, getEditProfile, postEditProfile} from "../controllers/userController.js";
import { isUserLoggedIn } from "../middlewares/auth.js";

const router = express.Router()

router.get("/", getHome)

router.get("/signup", getSignup)
router.post("/signup", postSignup)

router.get("/login", getLogin)
router.post("/login", postLogin)

router.get("/logout", getLogout)

router.get("/profile", isUserLoggedIn, getProfile)

router.get("/profile/edit", isUserLoggedIn, getEditProfile)
router.post("/profile/edit", isUserLoggedIn, postEditProfile)

export default router