import User from "../models/userModel.js"
import Product from "../models/productModel.js"
import bcrypt from "bcryptjs"
import { validationResult } from "express-validator"
import crypto from "crypto"
import {sendOTP} from "../config/mail.js"



export const getSignup = (req, res) =>{
    res.render("user/signup",{
        errors: [],
        oldData: {}
    })
}

export const postSignup = async (req, res) =>{
    try {
        const errors = validationResult(req)

        if(!errors.isEmpty()){
            return res.render("user/signup",{
                errors: errors.array(),
                oldData: req.body
            })
        }

        const {name, email, password, refCode} = req.body

        const existingUser = await User.findOne({email})

        if(existingUser){
            return res.render("user/signup", {
                errors:[{msg: "Email already exists", path: "email"}],
                oldData: req.body
            })
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        const hashedpassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedpassword,
            refCode: refCode || null,
            otp,
            otpExpires: Date.now()+2*60*1000,
            isVerified: false
        })

        await newUser.save()
        await sendOTP(email.otp)

        res.redirect(`/verify-otp?email=${email}`)


    } catch (error) {
        console.error("signup error: ", error)
        res.status(500).send("Server Error")
    }
}

export const verifyOTP = async (req, res) =>{
    const {email, otp} = req.body
    const user = await User.findOne({email})

    if(!user){
        return res.send("User not found")
    }

    if(user.otp != otp){
        return res.render("user/verifyOtp", {email,error: "Invalid OTP"})
    }

    if(user.otpExpires < Date.now()){
        return res.render("user/verifyOtp", {email,error: "OTP expired"})
    }

    user.isVerified = true
    user.otp = null
    user.otpExpires = null

    await user.save("/login")
}



export const getLogin= (req, res) =>{
    res.render("user/login")
}

export const postLogin = async(req, res) =>{
    try {
        
        const {email, password} = req.body

        const user = await User.findOne({email})

        if(!user){
            return res.send("User not found")
        }
        if(user.isBlocked){
            return res.send("You're blocked by Admin")
        }

        
        const isMatch = await bcrypt.compare(password, user.password)

        if(!isMatch){
            return res.send("Invalid Password")
        }
        req.session.user = user._id
        

        req.session.save(()=>{
            res.redirect("/")
        })

    } catch (error) {
        console.log(error)
        res.status(500).send("found server error")
    }
}

export const getHome = async (req, res) =>{
    console.log("home route hit")
    try {
        const products = await Product.find({isListed: true})
        console.log(products)

        res.render("user/home", {products,
            user: req.session.user || null
        })
    } catch (error) {
        console.log(error)
        res.status(500).send("Server Error")
    }
}

export const getLogout = (req, res) =>{
    req.session.destroy(() =>{
        res.redirect("/login")
    })
}


export const getProfile = async(req, res) =>{
    try{
        const userId = req.session.user
        
        const user = await User.findById(userId)

        res.render("user/profile",{user})
    } catch(error){
        console.log(error)
        res.status(500).send("Server Error")
    }
}

export const getEditProfile = async(req, res) =>{
    try {
        const userId = req.session.user

        const user = await User.findById(userId)

        res.render("user/editProfile", {user})
    } catch (error) {
        console.log(error)
        res.status(500).send("Server Error")        
    }
}

export const postEditProfile = async(req, res) =>{
    try {
        const userId = req.session.user
        const {fname, lname, email, phone} = req.body

        const name = fname + " " + lname

        if(!/^\d{10}$/.test(phone)){
            return res.send("Phone number should be exactly 10 digits")
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