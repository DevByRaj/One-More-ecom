import express from "express";
import { getHome, getLogin, getSignup, postSignup, postLogin,getLogout} from "../controllers/userController.js";
import { isUserLoggedIn } from "../middlewares/auth.js";

const router = express.Router()

router.get("/", isUserLoggedIn, getHome)

router.get("/login", getLogin)
router.post("/login", postLogin)

router.get("/signup", getSignup)
router.post("/signup", postSignup)

router.get("/logout", getLogout)



export default router