import User from "../models/userModel.js"
import Product from "../models/productModel.js"
import bcrypt from "bcryptjs"


export const getSignup=(req, res) =>{
    res.render("user/signup")
}

export const postSignup = async (req, res) =>{
    try{
        const {name, email, password, confirmPassword}= req.body

        if(!name || !email || !password || !confirmPassword){
            return res.send("All fields are required")
        }

        if(password !== confirmPassword){
            return res.send("Password not matched")
        }
        if(password.length < 8){
            return res.send("Password must be atlleast 8 characters ")
        }

        const existingUser = await User.findOne({email})

        if(existingUser){
            return res.send("User already exists")
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
        })

        await newUser.save();

        res.redirect("/login")
    } catch(error){
        console.error("Signup error:", error)
        res.status(500).send("Server Error")
    }
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
        console.log("session set:", req.session.user)

        res.redirect("/")

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
        console.log("BODY:", req.body)
        const userId = req.session.user
        const {name, email, phone} = req.body

        if(!/^\d{10}$/.test(phone)){
            return res.send("Phone number should be exactly 10 digits")
        }
        await User.findByIdAndUpdate(userId,{
            name, email, phone
        })
        res.redirect("/profile")
    } catch (error) {
        console.log(error)
        res.status(500).send("Server error")
    }
}