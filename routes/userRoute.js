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
import { getAddressPage, getAddAddress, postAddAddress, deleteAddress, setDefaultAddress,getSingleAddress} from "../controllers/userController.js";


const router = express.Router()

router.get("/",(req, res) =>{
        res.render("user/home", {
                user: req.session.user || null
        })
})

// router.get("/", (req, res) => {
//     if (req.session.user) return getHome(req, res);
//     return res.redirect("/login");
// });



router.get("/signup", isUserLoggedOut, getSignup)
router.post("/signup",isUserLoggedOut, validateSignup, postSignup)

router.get("/login",isUserLoggedOut, getLogin)
router.post("/login",isUserLoggedOut, postLogin)

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
        async(req, res) =>{
                if(!req.user.isVerifeid){
                        req.user.isVerifeid = true
                        await req.user.save()
                }
                req.session.user = req.user._id
                req.session.save(() =>{
                        res.redirect("/")
                })
        }
)


router.get("/verify-otp",isUserLoggedOut, (req, res) => {
  const { email } = req.query;


  if (!email) {
    return res.redirect("/signup");
  }

  res.render("user/verifyOtp", { email, error: null });
});

router.post("/verify-otp", verifyOTP)

router.get("/address", isUserLoggedIn, getAddressPage)
router.post("/address/add", isUserLoggedIn, postAddAddress)
router.get("/address/:id",isUserLoggedIn, getSingleAddress)
router.post("/address/delete/:id", isUserLoggedIn, deleteAddress);
router.get("/address/default/:id",isUserLoggedIn, setDefaultAddress)


export default router