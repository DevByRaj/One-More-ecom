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