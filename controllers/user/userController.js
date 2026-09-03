import User from "../../models/userModel.js"
import {findUserByEmail, hashPassword, sendOTP, comparePassword, sendForgotPasswordOTP, resetUserPassword, loginUser} from "../../services/authService.js"
import {validationResult} from "express-validator"
import crypto from "crypto"
import {sendOtpEmail} from "../../services/mailService.js"
import Address from "../../models/addressModel.js"
import {log} from "console"
import {create} from "domain"
import Product from "../../models/productModel.js"
import Category from "../../models/categoryModel.js"
import Variant from "../../models/variantModel.js"
import Brand from "../../models/brandModel.js"
import {getShopProducts, getProductDetailsService} from "../../services/productService.js"
import Cart from "../../models/cartModel.js"
import {getWishlist} from "../../services/wishlistService.js"


export const getSignup = (req, res) => {

  const refCode = req.query.ref || ""

  res.render("user/signup", {
    errors: [],
    oldData: {},
    refCode
  })
}

export const postSignup = async (req, res) => {
  try {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.render("user/signup", {
        errors: errors.array(),
        oldData: req.body,
        refCode: req.body.refCode || ""
      })
    }

    const {name, email, password, refCode} = req.body

    let user = await findUserByEmail(email)


    if (user && user.isVerified) {
      return res.render("user/signup", {
        errors: [{msg: "Email already Registered. Please login.", path: "email"}],
        oldData: req.body,
        refCode: req.body.refCode || ""
      })
    }

    const hashedPassword = await hashPassword(password)

    const {
      otp,
      isSent
    } = await sendOTP(email)

    req.session.tempUser = {
      name,
      email,
      password: hashedPassword,
      refCode: refCode || null,
      otp,
      otpExpires: Date.now() + 1 * 60 * 1000
    }

    if (!isSent) {
      return res.render("user/signup", {
        errors: [{msg: "Failed to send OTP. Try again.", path: "email"}],
        oldData: req.body,
        refCode: req.body.refCode || ""
      })
    }

    res.redirect(`/verify-otp?email=${email}&type=signup`)

  } catch (error) {
    console.log(error);

    return res.render("user/signup", {
      errors: [{msg: "something went wrong. Please try again.", path: "general"}],
      oldData: req.body || {},
      refCode: req.body?.refCode || ""
    })
  }
}

export const getVerifyOTP = async (req, res) => {

  try {

    const {email, type} = req.query

    if (type === "forgot" && req.session.resetDone) {
      return res.redirect(`/reset-password?email=${email}`)
    }

    let finalEmail = email
    let remainingSeconds = 0

    if (type === "emailEdit") {

      if (!req.session.emailEdit) {
        return res.redirect("/profile")
      }

      finalEmail = req.session.emailEdit.newEmail

      remainingSeconds = Math.max(
        0,
        Math.floor(
          (req.session.emailEdit.otpExpires - Date.now()) / 1000
        )
      )
    }

    else if (type === "signup") {

      const tempUser = req.session.tempUser

      if (tempUser?.otpExpires) {
        remainingSeconds = Math.max(
          0,
          Math.floor(
            (tempUser.otpExpires - Date.now()) / 1000
          )
        )
      }
    }

    else if (type === "passwordChange") {

      const data = req.session.passwordChange

      if (data?.otpExpires) {
        remainingSeconds = Math.max(
          0,
          Math.floor(
            (data.otpExpires - Date.now()) / 1000
          )
        )
      }
    }

    else if (type === "forgot") {

      const user = await User.findOne({email})

      if (user?.otpExpires) {
        remainingSeconds = Math.max(
          0,
          Math.floor(
            (user.otpExpires - Date.now()) / 1000
          )
        )
      }
    }

    if (!finalEmail) {
      return res.redirect("/signup")
    }

    return res.render("user/verifyOtp", {
      email: finalEmail,
      error: null,
      type,
      remainingSeconds
    })

  } catch (error) {

    console.log(error)

    return res.redirect("/login")
  }
}

export const verifyOTP = async (req, res) => {
  try {
    const {email, otp, type} = req.body

    let remainingSeconds = 60;

    if (type === "forgot") {
      const user = await User.findOne({email})

      if (!user) {
        return res.send("user not found")
      }

      if (user.otp !== otp) {
        remainingSeconds = Math.max(0, Math.floor((user.otpExpires - Date.now()) / 1000));
        return res.render('user/verifyOtp', {
          email,
          error: "Invalid OTP",
          type,
          remainingSeconds
        })
      }

      if (user.otpExpires < Date.now()) {
        return res.render("user/verifyOtp", {
          email,
          error: "OTP expired",
          type,
          remainingSeconds: 0
        })
      }
      req.session.resetDone = true

      return res.redirect(`/reset-password?email=${email}`)
    }

    if (type === "passwordChange") {
      const data = req.session.passwordChange

      if (!data) {
        return res.redirect("/profile")
      }

      if (data.otp !== otp) {
        return res.render("user/verifyOtp", {
          email: "",
          type,
          error: "Invalid OTP",
          remainingSeconds: Math.max(0, Math.floor((data.otpExpires - Date.now()) / 1000))
        })
      }

      if (data.otpExpires < Date.now()) {
        return res.render("user/verifyOtp", {
          email: "",
          type,
          error: "OTP expired",
          remainingSeconds: 0
        })
      }

      await User.findByIdAndUpdate(data.userId, {
        password: data.newPassword
      })
      req.session.passwordChange = null

      return res.redirect("/?msg=password-updated")
    }

    if (type === "emailEdit") {
      const data = req.session.emailEdit;

      if (!data) {
        return res.redirect("/profile");
      }

      if (data.otp !== otp) {
        return res.render("user/verifyOtp", {
          email: data.newEmail,
          error: "Invalid OTP",
          type,
          remainingSeconds: Math.max(
            0,
            Math.floor((data.otpExpires - Date.now()) / 1000)
          )
        })
      }

      if (data.otpExpires < Date.now()) {
        return res.render("user/verifyOtp", {
          email: data.newEmail,
          error: "OTP expired",
          type,
          remainingSeconds: 0
        })
      }

      await User.findByIdAndUpdate(req.session.user, {
        email: data.newEmail,
        name: data.name,
        phone: data.phone,
        profileImage: data.profileImage
      })

      req.session.emailEdit = null

      return res.redirect("/profile/edit?msg=email-updated");
    }

    const tempUser = req.session.tempUser

    if (!tempUser || tempUser.email !== email) {
      return res.redirect("/signup")
    }

    if (tempUser.otp !== otp) {
      remainingSeconds = Math.max(0, Math.floor((tempUser.otpExpires - Date.now()) / 1000));
      return res.render("user/verifyOtp", {
        email,
        error: "Invalid OTP",
        type,
        remainingSeconds
      })
    }

    if (tempUser.otpExpires < Date.now()) {
      return res.render("user/verifyOtp", {
        email,
        error: "OTP expired",
        type,
        remainingSeconds: 0
      })
    }

    let referredBy = null

    if (tempUser.refCode) {

      const referringUser = await User.findOne({
        referralCode: tempUser.refCode
      })

      if (referringUser) {
        referredBy = referringUser._id
      }
    }

    const newUser = new User({
      name: tempUser.name,
      email: tempUser.email,
      password: tempUser.password,
      referredBy,
      isVerified: true
    })

    await newUser.save()

    req.session.tempUser = null

    return res.redirect("/login?msg=signup-success")

  } catch (err) {
    console.log("OTP Error:", err);

    const email = req.body?.email || ""
    const type = req.body?.type || "signup"

    return res.render("user/verifyOtp", {
      email,
      type,
      error: "Something went wrong. Please try again.",
      remainingSeconds: 0
    })

  }
}

export const getLogin = (req, res) => {

  let errors = {}

  let success = null

  if (req.query.error === "blocked") {
    errors.general = 'Your account is blocked by admin'
  }

  if (req.query.reset === "success") {
    success = "Password changed successfully"
  }
  res.render("user/login", {
    errors,
    success,
    oldData: {}
  })
}

export const postLogin = async (req, res) => {
  try {

    const {email, password} = req.body

    const result = await loginUser(email, password)

    if (!result.success) {
      return res.render("user/login", {
        errors: {
          [result.field]: result.message
        },
        success: null,
        oldData: req.body
      })
    }

    const user = result.user

    req.session.regenerate((err) => {
      if (err) {
        console.log(err)
        return res.redirect("/login")
      }
      req.session.user = user._id

      req.session.save(() => {
        res.redirect("/")

      })
    })

  } catch (error) {
    console.log(error)
    res.render("user/login", {
      errors: {general: 'Something went Wrong'},
      success: null,
      oldData: req.body
    })
  }
}

export const getHome = async (req, res) => {

  try {
    const products = await Product.find({isListed: true})

    res.render("user/home", {
      products,
      user: req.session.user || null
    })
  } catch (error) {
    console.error("user/home", error);

    return res.render("user/home", {
      products: [],
      error: "Unable load Products. Please try again later"
    })
  }
}

export const getLogout = (req, res) => {

  req.session.destroy((err) => {
    if (err) {
      console.log("logout error:", err)
      return res.redirect("/")
    }
    res.clearCookie("onemore.sid")
    res.redirect("/login")
  })

}


export const getProfile = async (req, res) => {
  try {
    const userId = req.session.user
    if (!userId) {
      return res.redirect("/login")
    }

    const success = req.session.success || null

    req.session.success = null

    const user = await User.findById(userId);

    if (!user) {
      return res.redirect("/login")
    }

    res.render("user/profile", {user, success})

  } catch (error) {
    console.log(error)
    res.render("user/profile", {
      user: null,
      success: null,
      error: "Something went wrong"
    })

  }
}

export const getEditProfile = async (req, res) => {
  try {
    const userId = req.session.user

    const user = await User.findById(userId)

    const message =
      req.query.msg === "email-updated" ? "Email updated successfully" : null

    res.render("user/editProfile", {
      user,
      errors: {},
      oldData: {},
      message
    })
  } catch (error) {
    console.log(error)
    res.status(500).render("user/editProfile", {
      user: null,
      error: "Something went worng. Please try again.",
      errors: {},
      oldData: {}
    })
  }
}

export const postEditProfile = async (req, res) => {
  try {
    const userId = req.session.user
    
    const {fname, lname, email, phone} = req.body

    const firstName = fname?.trim()
    const lastName = lname?.trim()

    const nameRegex = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/

    if (!firstName || !nameRegex.test(firstName)) {

      const user = await User.findById(userId)

      return res.render("user/editProfile", {
        user,
        errors: {
          fname: "Please enter a valid first name"
        },
        oldData: req.body,
        message: null
      })
    }

    if (!lastName || !nameRegex.test(lastName)) {

      const user = await User.findById(userId)

      return res.render("user/editProfile", {
        user,
        errors: {
          lname: "Please enter a valid last name"
        },
        oldData: req.body,
        message: null
      })
    }

    const name = `${firstName} ${lastName}`

    if (!/^\d{10}$/.test(phone)) {

      const user = await User.findById(userId)

      return res.render("user/editProfile", {
        user,
        errors: {
          phone: "Phone number should be exactly 10 digits"
        },
        oldData: req.body
      })
    }

    const user = await User.findById(userId)

    if(user.authType === "google" && email !== user.email){
      
      return res.render("user/editProfile",{
        user,
        errors:{
          email: "Email cannot be changed for Google Login Users"
        },
        oldData: req.body,
        message: null
      })
    }

    if (email !== user.email) {

      const existing = await User.findOne({email})
      if (existing) {
        return res.render("user/editProfile", {
          user,
          errors: {email: "Email already exists"},
          oldData: req.body
        })
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString()

      req.session.emailEdit = {
        newEmail: email,
        oldEmail: user.email,
        otp,
        otpExpires: Date.now() + 60 * 1000,
        name,
        phone,
        profileImage: req.file ? "/uploads/" + req.file.filename : user.profileImage
      }

      await sendOtpEmail(user.email, otp)

      return res.redirect("/verify-otp?type=emailEdit")
    }

    let updateData = {
      name, email, phone
    }
    if (req.file) {
      updateData.profileImage = "/uploads/" + req.file.filename
    }

    await User.findByIdAndUpdate(userId, updateData)

    req.session.success = "profile edited successfully"

    res.redirect("/profile")

  } catch (error) {
    console.log(error)
    const user = await User.findById(req.session.user)
    res.render("user/editProfile", {
      user,
      errors: {},
      oldData: {},
      message: null,
      error: "Something went wrong"
    })
  }
}

export const getAddressPage = async (req, res) => {
  try {
    const userId = req.session.user;

    const addresses = await Address.find({userId});

    const error = req.query.error || null

    res.render("user/address", {
      user: userId,
      addresses,
      error
    });
  } catch (error) {
    console.log(error);
    res.redirect("/address?error=server")

  }
}

export const getAddAddress = (req, res) => {
  res.render("user/addAddress", {
    errors: {},
    oldData: {}
  });
};

export const postAddAddress = async (req, res) => {
  try {
    const userId = req.session.user

    const {
      fname, lname, phone,
      house, street, city,
      state, pin, type,
      addressId
    } = req.body
    if (!fname || !phone || !house || !city || !state || !pin) {
      return res.redirect("/address?error=empty")
    }
    const name = fname + " " + lname



    const addressData = {
      userId,
      name,
      houseName: house,
      street,
      city,
      state,
      country: "india",
      phone,
      pincode: pin,
      type
    }

    if (addressId) {
      await Address.findByIdAndUpdate(addressId, addressData)
    }
    else {
      const count = await Address.countDocuments({userId})

      if (count >= 3) {
        return res.redirect("/address?error=limit")
      }

      if (count === 0) {
        addressData.isDefault = true
      }

      await Address.create(addressData)
    }
    res.redirect("/address")
  } catch (error) {
    console.log(error)
    res.status(500).send("error saving address")
  }
}

export const postAddAddressFromCheckout = async (req, res) => {
  try {

    const userId = req.session.user

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first"
      })
    }

    const {
      fname,
      lname,
      phone,
      house,
      street,
      city,
      state,
      pin,
      type
    } = req.body

    if (!fname || !phone || !house || !city || !state || !pin) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields"
      })
    }

    const count = await Address.countDocuments({userId});

    if (count >= 3) {
      return res.status(400).json({
        success: false,
        message: "You can add maximum 3 addresses"
      });
    }

    const name = `${fname} ${lname || ""}`.trim()

    const addressData = {
      userId,
      name,
      houseName: house,
      street,
      city,
      state,
      country: "india",
      phone,
      pincode: pin,
      type,
      isDefault: count === 0
    }

    const address = await Address.create(addressData);

    return res.json({
      success: true,
      message: "Address added successfully",
      address
    })

  } catch (error) {

    console.log("Checkout address error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save address"
    })
  }
}

export const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const addressId = req.params.id;

    await Address.findOneAndDelete({
      _id: addressId,
      userId: userId
    });

    res.redirect("/address");
  } catch (error) {
    res.render("user/address", {
      user,
      addresses,
      error
    })

  }
}

export const setDefaultAddress = async (req, res) => {
  try {

    const userId = req.session.user
    const addressId = req.params.id

    const address = await Address.findOne({_id: addressId, userId})

    if (!address) {
      return res.redirect("/address?error=notfound")
    }

    await Address.updateMany({userId}, {isDefault: false})

    address.isDefault = true
    await address.save()

    res.redirect("/address")

  } catch (error) {
    console.log(error);
    res.redirect("/address?error=server")


  }
}

export const getForgotPassword = (req, res) => {
  res.render("user/forgotPassword", {error: null})
}

export const postForgotPassword = async (req, res) => {
  try {

    const {email} = req.body

    const result = await sendForgotPasswordOTP(email)

    if (!result.success) {

      return res.render("user/forgotPassword", {
        error: result.message
      })
    }

    res.redirect(`/verify-otp?email=${email}&type=forgot`)

  } catch (error) {
    console.log(error)

    return res.render("user/forgotPassword", {
      error: "someting went worng"
    })

  }
}

export const getResetPassword = (req, res) => {
  const {email} = req.query

  res.render("user/resetPassword", {
    email,
    error: null
  })
}

export const postResetPassword = async (req, res) => {
  try {

    const {email, password, confirmPassword} = req.body

    const result = await resetUserPassword(email, password, confirmPassword)

    if (!result.success) {

      return res.render("user/resetPassword", {
        email,
        error: result.message
      })
    }

    req.session.resetDone = false

    res.redirect("/login?reset=success")

  } catch (error) {
    console.log(error)

    return res.render("user/resetPassword", {
      email: req.body.email,
      error: "Something went wrong"
    })

  }
}


export const resendOTP = async (req, res) => {
  try {
    const {email, type} = req.body || req.query

    if (type === "passwordChange") {
      const data = req.session.passwordChange

      if (!data) {
        return res.redirect("/profile")
      }

      if (data.otpExpires > Date.now()) {
        const remainingSeconds = Math.floor((data.otpExpires - Date.now()) / 1000)

        return res.render("user/verifyOtp", {
          email: "",
          type,
          error: "Please wait before requesting New OTP",
          remainingSeconds
        })
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString()

      data.otp = otp
      data.otpExpires = Date.now() + 60 * 1000

      const user = await User.findById(data.userId)

      await sendOtpEmail(user.email, otp)

      return res.render("user/verifyOtp", {
        email: "",
        type,
        error: "New OTP sent successfully",
        remainingSeconds: 60
      })
    }


    if (type === "signup") {
      const tempUser = req.session.tempUser

      if (!tempUser) {
        return res.redirect("/signup")
      }

      if (tempUser.otpExpires > Date.now()) {
        const remainingSeconds = Math.floor((tempUser.otpExpires - Date.now()) / 1000)

        return res.render("user/verifyOtp", {
          email: tempUser.email,
          type,
          error: "Please wait before requesting new OTP",
          remainingSeconds
        })
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString()

      tempUser.otp = otp
      tempUser.otpExpires = Date.now() + 60 * 1000

      await sendOtpEmail(tempUser.email, otp)

      return res.render("user/verifyOtp", {
        email: tempUser.email,
        type,
        error: "New OTP sent successfully",
        remainingSeconds: 60
      })
    }

    if (type === "emailEdit") {
      const data = req.session.emailEdit

      if (!data) {
        return res.redirect("/profile")
      }

      if (data.otpExpires > Date.now()) {
        const remainingSeconds = Math.floor((data.otpExpires - Date.now()) / 1000)

        return res.render("user/verifyOtp", {
          email: data.newEmail,
          type,
          error: "Please wait before requesting new OTP",
          remainingSeconds
        })
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString()

      data.otp = otp
      data.otpExpires = Date.now() + 60 * 1000

      await sendOtpEmail(data.oldEmail, otp)

      return res.render("user/verifyOtp", {
        email: data.newEmail,
        type,
        error: "New OTP sent successfully",
        remainingSeconds: 60
      })
    }

    const user = await User.findOne({email});

    if (!user) {
      return res.send("User not found");
    }

    if (user.otpExpires > Date.now()) {
      const remainingSeconds = Math.floor((user.otpExpires - Date.now()) / 1000);
      return res.render("user/verifyOtp", {
        email,
        type,
        error: "Please wait before requesting new OTP",
        remainingSeconds
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString()

    user.otp = otp;
    user.otpExpires = Date.now() + 60 * 1000;

    await user.save();

    await sendOtpEmail(email, otp)

    console.log("resend otp:", otp)

    res.render("user/verifyOtp", {
      email,
      type,
      error: "New OTP sent successfully",
      remainingSeconds: 60
    });

  } catch (error) {
    console.log(error)

    res.render("user/verifyOtp", {
      email: "",
      type: "",
      error: "Error resending OTP"
    })
  }
}

export const getSingleAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    res.json(address);
  } catch (error) {
    res.status(500).json({message: "Error fetching address"});
  }
}

export const getChangePassword = async (req, res) => {
  try {

    const userId = req.session.user;

    const user = await User.findById(userId)

    if (!user) {
      return res.redirect("/login")
    }

    return res.render("user/changePassword", {
      user,
      error: null
    })

  } catch (error) {

    console.log(error);

    return res.redirect("/profile")
  }
}

export const postChangePassword = async (req, res) => {
  try {

    const userId = req.session.user
    const {currentPassword, newPassword, confirmPassword} = req.body

    const user = await User.findById(userId)

    if(!user){
      return res.redirect("/login")
    }

    if(user.authType === "google"){
      return res.redirect("/profile")
    }

    const isMatch = await comparePassword(currentPassword, user.password)
    if (!isMatch) {
      return res.render("user/changePassword", {
        user,
        error: "Incorrect current password"
      })
    }

    if (newPassword !== confirmPassword) {
      return res.render("user/changePassword", {
        user,
        error: "password do not match"
      })
    }

    if (newPassword.length < 8) {
      return res.render("user/changePassword", {
        user,
        error: "Password must be at least 8 characters"
      })
    }

    const isSame = await comparePassword(newPassword, user.password)
    if (isSame) {
      return res.render("user/changePassword", {
        user,
        error: "New password cannot be same as old password"
      })
    }

    user.password = await hashPassword(newPassword)
    await user.save()

    req.session.success = "Password changed successfully"

    return res.redirect("/profile")

  } catch (error) {
    console.log(error)
    res.render("user/changePassword", {
      user,
      error: "Something went wrong"
    })
  }
}

export const checkUserStatus = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({blocked: true})
    }

    const user = await User.findById(req.session.user)

    if (user && user.isBlocked) {
      req.session.destroy(() => {
        return res.status(401).json({blocked: true})
      })
    }
    res.status(200).json({ok: true})

  } catch (error) {
    res.status(500).json({error: true})

  }
}

export const getShop = async (req, res) => {
  try {

    const shopData = await getShopProducts(req.query)

    let wishlist = []

    if(req.session.user){

      const userWishlist = await getWishlist(req.session.user)

      if(userWishlist){

        wishlist = userWishlist.products.map( item => item.productId?._id.toString())
      }
    }

    res.render("user/shop", {
      ...shopData, query: req.query, wishlist
    })
  } catch(error){

    console.log(error)

    res.redirect('/')
  }
}

export const getProductDetails = async (req, res) => {

  try {

    const productData = await getProductDetailsService(req.query.id)

    if (!productData) {
      return res.redirect("/shop")
    }

    const unavailable = !productData.product.isListed

    res.render("user/productDetails", {
      ...productData,
      unavailable
    })

  } catch (error) {
    console.log(error)

    res.redirect("/shop")
  }
}
