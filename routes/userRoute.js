import express from "express";
import { getHome,
        getLogin, postLogin,
        getSignup, postSignup, 
        getLogout,
        getProfile, getEditProfile, postEditProfile,
        verifyOTP} from "../controllers/userController.js";
import { isUserLoggedIn, isUserLoggedOut } from "../middlewares/auth.js";
import { validateSignup } from "../middlewares/validation.js";
import upload from "../middlewares/multer.js";
import passport from "passport";
import { getAddressPage, getAddAddress, postAddAddress, deleteAddress } from "../controllers/userController.js";


const router = express.Router()

router.get("/", getHome)

router.get("/signup", isUserLoggedOut, getSignup)
router.post("/signup",validateSignup, postSignup)

router.get("/login",isUserLoggedOut, getLogin)
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
                
                if(req.user.isVerified){
                        req.session.user = req.user._id

                        return req.session.save(() =>{
                                res.redirect("/")
                        })
                } else{
                        return res.redirect(`/verify-otp?email=${req.user.email}`)
                }
        }
)

router.get("/verify-otp", (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.redirect("/signup");
  }

  res.render("user/verifyOtp", { email, error: null });
});

router.post("/verify-otp", verifyOTP)

router.get("/address", isUserLoggedIn, getAddressPage)
router.get("/address/add", isUserLoggedIn, getAddAddress)
router.post("/address/add", isUserLoggedIn, postAddAddress)
router.get("/address/delete/:id", isUserLoggedIn, deleteAddress);

export default router