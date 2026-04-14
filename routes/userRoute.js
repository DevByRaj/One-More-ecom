import express from "express";
import { getHome, getLogin, getSignup, postSignup, postLogin,getLogout} from "../controllers/userController.js";
import { isUserLoggedIn } from "../middlewares/auth.js";

const router = express.Router()

router.get("/", getHome)

router.get("/signup", getSignup)
router.post("/signup", postSignup)

router.get("/login", getLogin)
router.post("/login", postLogin)

router.get("/logout", getLogout)

router.get("/profile", isUserLoggedIn, getProfile)

export default router