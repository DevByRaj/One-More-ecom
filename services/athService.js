import bcrypt from "bcryptjs";
import User from "../models/userModel.js"
import {sendOtpEmail} from "./mailService.js"

export const generateOTP =() =>{

    return Math.floor(1000+Math.random()*9000).toString()
}

export const hashPassword = async(password) =>{
    return await bcrypt.hash(password,10)
}

export const comparePassword = async(password, hashPassword) =>{
    return await bcrypt.compare(password,hashPassword)
}

export const sendOTP = async(email) =>{
    const otp = generateOTP()

    const isSent = await sendOtpEmail(email,otp)

    return{
        otp, isSent
    }
}

export const findUserByEmail = async(email) =>{
    return await User.findOne({
        email
    })
}
export const loginUser = async(email, password) =>{

    const user = await findUserByEmail(email)

    if(!user){
        return{
            success: false,
            field: "email",
            message: "Invalid email or password"
        }
    }

    const isMatch = await comparePassword(password, user.password)

    if(!isMatch){
        return{
            success: false,
            field: "password",
            message: "Invalid email or password"
        }
    }

    if(user.isBlocked){
        return{
            success: false,
            field: "email",
            message: "Your account is blocked"
        }
    }

    return {
        success: true,
        user
    }
}

export const sendForgotPasswordOTP = async(email) =>{

    const user = await findUserByEmail(email)

    if(!user){

        return{
            success: false,
            message: "Email not registerd"
        }
    }

    const{otp, isSent} = await sendOTP(email)

    if(!isSent){
        return{
            success: false,
            message: "Failed to send OTP"
        }
    }

    user.otp = otp

    user.otpExpires = Date.now()+1*60*1000

    await user.save()

    return{
        success: true
    }
}

export const resetUserPassword = async(email, password, confirmPassword) =>{

    const user = await findUserByEmail(email)

    if(!user){
        return{
            success: false,
            message: "user not found"
        }
    }

    if(password !== confirmPassword){

        return{
            success: false,
            message: "Password do not match"
        }
    }

    if(password.length < 6){
        return{
            success: true,
            message: "Password must be at least 6 characters"
        }
    }

    const hashedPassword = await hashPassword(password)

    user.password = hashedPassword

    user.otp = null

    user.otpExpires = null

    await user.save()

    return{
        success: true
    }

}