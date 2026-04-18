import express from "express";
import { getHome,
        getLogin, postLogin,
        getSignup, postSignup, 
        getLogout,
        getProfile, getEditProfile, postEditProfile,
        verifyOTP} from "../controllers/userController.js";
import { isUserLoggedIn } from "../middlewares/auth.js";
import { validateSignup } from "../middlewares/validation.js";
import upload from "../middlewares/multer.js";
import passport from "passport";


const router = express.Router()

router.get("/", getHome)

router.get("/signup",  getSignup)
router.post("/signup",validateSignup, postSignup)

router.get("/login", getLogin)
router.post("/login", postLogin)

router.get("/logout", getLogout)

router.get("/profile", isUserLoggedIn, getProfile)

router.get("/profile/edit", isUserLoggedIn, getEditProfile)
// router.post("/profile/edit", isUserLoggedIn, postEditProfile)

router.post("/profile/edit", isUserLoggedIn, upload.single("profileImage"), postEditProfile)

router.get("/auth/google",
        passport.authenticate("google", {scope:["profile", "email"]})
)

router.get("/auth/google/callback",
        passport.authenticate("google", {
                failureRedirect: "/login"
        }),
        (req, res) =>{
                req.session.user = req.user._id
                res.redirect("/")
        }
)

router.get("/verify-otp", (req, res) => {
    res.render("user/verifyOtp", {
        email: req.query.email,
        error: null
    });
});
router.post("/verify-otp", verifyOTP)

export default router