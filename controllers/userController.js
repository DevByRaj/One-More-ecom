import User from "../models/userModel.js"
import Product from "../models/productModel.js"
import bcrypt from "bcryptjs"
import { validationResult } from "express-validator"
import crypto from "crypto"
import {sendOtpEmail} from "../services/mailService.js"
import Address from "../models/addressModel.js"



export const getSignup = (req, res) =>{
    res.render("user/signup",{
        errors: [],
        oldData: {}
    })
}

export const postSignup = async (req, res) => {
  try {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.render("user/signup", {
        errors: errors.array(),
        oldData: req.body
      })
    }

    const { name, email, password, refCode } = req.body

    let user = await User.findOne({ email })


    if (user && user.isVerified) {
      return res.render("user/signup", {
        errors: [{ msg: "User already exists. Please login.", path: "email" }],
        oldData: req.body
      })
    }


    // if (user && !user.isVerified) {
    //   const otp = Math.floor(1000 + Math.random() * 9000).toString()

    //   console.log(otp)
    //   user.otp = otp
    //   user.otpExpires = Date.now() + 2 * 60 * 1000

    //   await user.save()
      
    //   const isEmailSent = await sendOtpEmail(email, otp)

    //   if(!isEmailSent){
    //     return res.render("user/signup", {
    //         errors: [{msg: "Invalid email address. Please use a valid email", path: "email" }],
    //         oldData: req.body
    //     })
    //   }
    //   return res.redirect(`/verify-otp?email=${email}`)
    // }


    const otp = Math.floor(1000 + Math.random() * 9000).toString()
const hashedPassword = await bcrypt.hash(password, 10)

req.session.tempUser = {
  name,
  email,
  password: hashedPassword,
  refCode: refCode || null,
  otp,
  otpExpires: Date.now() + 2 * 60 * 1000
}

// send OTP
const isSent = await sendOtpEmail(email, otp)

if (!isSent) {
  return res.render("user/signup", {
    errors: [{ msg: "Failed to send OTP. Try again.", path: "email" }],
    oldData: req.body
  })
}

res.redirect(`/verify-otp?email=${email}`)
  

    // user = new User({
    //   name,
    //   email,
    //   password: hashedPassword,
    //   refCode: refCode || null,
    //   otp,
    //   otpExpires: Date.now() + 2 * 60 * 1000,
    //   isVerified: false
    // })

    // await user.save()
    


  } catch (error) {
    
    res.status(500).send("Server Error")
  }
}

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const tempUser = req.session.tempUser;

    if (!tempUser || tempUser.email !== email) {
      return res.redirect("/signup");
    }

    if (tempUser.otp !== otp) {
      return res.render("user/verifyOtp", {
        email,
        error: "Invalid OTP"
      });
    }

    if (tempUser.otpExpires < Date.now()) {
      return res.render("user/verifyOtp", {
        email,
        error: "OTP expired"
      });
    }

    // ✅ SAVE USER ONLY AFTER SUCCESS
    const newUser = new User({
      name: tempUser.name,
      email: tempUser.email,
      password: tempUser.password,
      refCode: tempUser.refCode,
      isVerified: true
    });

    await newUser.save();

    req.session.user = newUser._id;

    // clear session temp data
    req.session.tempUser = null;

    req.session.save(() => {
      res.redirect("/");
    });

  } catch (error) {
    res.status(500).send("server Error");
  }
};

// export const verifyOTP = async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     if (!email) {
//       return res.redirect("/signup");
//     }

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.send("User not found");
//     }

//     if (user.otp !== otp) {
//       return res.render("user/verifyOtp", {
//         email,
//         error: "Invalid OTP"
//       });
//     }  

//     if (user.otpExpires < Date.now()) {
//       return res.render("user/verifyOtp", {
//         email,
//         error: "OTP expired"
//       });
//     }

//     user.isVerified = true
//     user.otp = null;
//     user.otpExpires = null

//     await user.save();

//     req.session.user = user._id

//     req.session.save(() => {
//       res.redirect("/")
//     });

//   } catch (error) {
//     res.status(500).send("server Error")
//   }
// }


export const getLogin= (req, res) =>{
    res.render("user/login",{
        errors: {},
        oldData: {}
    })
}

export const postLogin = async(req, res) =>{
    try {
        
        const {email, password} = req.body

        const user = await User.findOne({email})    

        if(!user){
            return res.render('user/login',{
                errors: {email: "user not found"},
                oldData: req.body
            })
        }
        if(user.isBlocked){
            return res.render("user/login",{
                errors: {email:"You are blocked by admin",
                    oldData: req.body
                }
            })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if(!isMatch){
            return res.render("user/login", {
                errors: {password: "invalid password"},
                oldData: req.body
            })
        }
        req.session.regenerate((err)=>{
            if(err){
                console.log( err)
                return res.redirect("/login")
            }
            req.session.user = user._id

            req.session.save(() =>{
                res.redirect("/")
                                   
            })
        })

    } catch (error) {
        console.log(error)
        res.status(500).send("found server error")
    }
}

export const getHome = async (req, res) =>{
    
    try {
        const products = await Product.find({isListed: true})

        res.render("user/home", {products,
            user: req.session.user || null
        })
    } catch (error) {
        console.log(error)
        res.status(500).send("Server Error")
    }
}

export const getLogout = (req, res) =>{

    req.session.destroy((err) =>{
        if(err){
            console.log("logout error:", err)
            return res.redirect("/")
        }
        res.clearCookie("onemore.sid")
         res.redirect("/login")
    })

}


export const getProfile = async(req, res) =>{
    try {
        const userId = req.session.user
        if(!userId){
            return res.redirect("/login")
        }

        const user = await User.findById(userId);

        if(!user){
            return res.redirect("/login")
        }

        res.render("user/profile", {user})
       
    } catch (error) {
        console.log(error)
        res.status(500).send("server Error")
        
    }
}

export const getEditProfile = async(req, res) =>{
    try {
        const userId = req.session.user

        const user = await User.findById(userId)

        res.render("user/editProfile", {
            user,
            errors: {},
            oldData: {}
        })
    } catch (error) {
        console.log(error)
        res.status(500).send("Server Error")        
    }
}

export const postEditProfile = async(req, res) =>{
    try {
        const userId = req.session.user
        const {fname, lname, email, phone} = req.body

        // const name = fname + " " + lname
        const name = `${fname || ""} ${lname || ""}`.trim();

        if(!/^\d{10}$/.test(phone)){
            const user = await User.findById(userId)

            return res.render("user/editProfile", {
                user,
                errors: {
                    phone: "Phone number should be exactly 10 digits"
                },
                oldData: req.body
            })
        }

        let updateData ={
            name, email, phone
        }
        if(req.file){
            updateData.profileImage = "/uploads/" + req.file.filename
        }

        await User.findByIdAndUpdate(userId, updateData)

        res.redirect("/profile")
        
    } catch (error) {
        console.log(error)
        res.status(500).send("Server error")
    }
}

export const getAddressPage = async (req, res) => {
  const userId = req.session.user;

  const addresses = await Address.find({ userId });

  const error = req.query.error || null

  res.render("user/address", { addresses, error });
}

export const getAddAddress = (req, res) => {
  res.render("user/addAddress", {
    errors: {},
    oldData: {}
  });
};

export const postAddAddress = async( req, res) =>{
    try{
        const userId = req.session.user

        const{
            fname, lname, phone,
            house, street, city,
            state, pin, type,
            addressId
        } = req.body
        if (!fname || !phone || !house || !city || !state || !pin) {
          return res.redirect("/address?error=empty")
}
        const name = fname+" "+lname
          
        

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

        if(addressId){
          await Address.findByIdAndUpdate(addressId, addressData)
        }
        else{
          const count = await Address.countDocuments({userId})

          if(count >= 3){
            return res.redirect("/address?error=limit")
          }
          await Address.create(addressData)
        }
        res.redirect("/address")
    } catch(error){
        console.log(error)
        res.status(500).send("error saving address")
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
    console.log(error);
    res.status(500).send("Error deleting address");
  }
}

export const setDefaultAddress = async(req, res) =>{
  const userId = req.session.user

  await Address.updateMany({userId}, {isDefault: false})

  await Address.findByIdAndUpdate(req.params.id,{
    isDefault: true
  })
  res.redirect("/address")
}

export const getSingleAddress = async (req, res) =>{
  try{
    const address = await Address.findById(req.params.id)
    res.json(address)
  } catch(error){
    res.status(500).send("Error fetching address")
  }
}