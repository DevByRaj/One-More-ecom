import express from "express";
import {
  getHome,
  getLogin, postLogin,
  getSignup, postSignup,
  getLogout,
  getProfile, getEditProfile, postEditProfile,
  getVerifyOTP,
  verifyOTP,
  setDefaultAddress,
  getForgotPassword,
  postForgotPassword,
  getResetPassword,
  postResetPassword,
  getAddressPage, getAddAddress, postAddAddress, deleteAddress,
  getSingleAddress,
  resendOTP,
  postChangePassword,
  checkUserStatus,
  getShop,
  getProductDetails
} from "../controllers/user/userController.js";
import {isUserLoggedIn, isUserLoggedOut} from "../middlewares/auth.js";
import {validateSignup} from "../middlewares/validation.js";
import upload from "../middlewares/multer.js";
import passport from "passport";
import {
  addToCart,
  getCart,
  updateCartQuantity,
  removeCartItem,
  saveForLater,
  moveSavedItemToCart
} from "../controllers/user/cartController.js"

import {addWishlist, getWishlistPage, removeWishlistProduct, toggleWishlist} from "../controllers/user/wishlistController.js";

import { getCheckout } from "../controllers/user/orderController.js";

const router = express.Router()

router.get("/", (req, res) => {

  let message = null

  if (req.query.msg === "password-updated") {
    message = "Password changed successfully"
  }
  res.render("user/home", {
    user: req.session.user || null,
    message
  })
})



router.get("/signup", isUserLoggedOut, getSignup)
router.post("/signup", isUserLoggedOut, validateSignup, postSignup)

router.get("/login", isUserLoggedOut, getLogin)
router.post("/login", isUserLoggedOut, postLogin)

router.get("/logout", getLogout)

router.get("/profile", isUserLoggedIn, getProfile)

router.get("/profile/edit", isUserLoggedIn, getEditProfile)

router.post("/profile/edit", isUserLoggedIn, upload.single("profileImage"), postEditProfile)

router.get("/auth/google",
  passport.authenticate("google", {scope: ["profile", "email"]})
)

router.get("/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login"
  }),
  (req, res) => {
    req.session.user = req.user._id;
    res.redirect("/");
  }
);

router.get("/verify-otp", getVerifyOTP)


router.post("/verify-otp", verifyOTP)

router.get("/address", isUserLoggedIn, getAddressPage)
router.post("/address/add", isUserLoggedIn, postAddAddress)
router.get("/address/:id", isUserLoggedIn, getSingleAddress)
router.post("/address/delete/:id", isUserLoggedIn, deleteAddress);
router.get("/address/default/:id", isUserLoggedIn, setDefaultAddress)

router.get("/forgot-password", getForgotPassword)
router.post("/forgot-password", postForgotPassword)

router.get("/reset-password", getResetPassword)
router.post("/reset-password", postResetPassword)

router.post("/resend-otp", resendOTP)

router.get("/change-password", isUserLoggedIn, (req, res) => {
  res.render("user/changePassword", {error: null})
})

router.post("/change-password", isUserLoggedIn, postChangePassword)

router.get("/check-user-status", checkUserStatus)

router.get("/shop", getShop)

router.get("/productDetails", getProductDetails)

router.post("/cart/add", isUserLoggedIn, addToCart)

router.get("/cart", isUserLoggedIn, getCart)

router.post("/cart/update-quantity", isUserLoggedIn, updateCartQuantity)

router.post("/cart/remove/:id", isUserLoggedIn, removeCartItem)

router.post("/wishlist/add", isUserLoggedIn, addWishlist)

router.get("/wishlist", isUserLoggedIn, getWishlistPage)

router.post("/wishlist/remove/:id", isUserLoggedIn, removeWishlistProduct)

router.post("/wishlist/toggle", isUserLoggedIn, toggleWishlist)

router.post("/cart/save-for-later/:id", isUserLoggedIn, saveForLater)

router.post("/cart/move-to-cart/:id", isUserLoggedIn, moveSavedItemToCart)

router.get("/checkout", isUserLoggedIn, getCheckout)

export default router