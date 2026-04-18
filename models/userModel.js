import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
     name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        // match: [/^[a-zA-Z0-9._%+-]+@gmail\.com$/, "Require valid email"],
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        default: "",
    },
    profileImage:{
        type: String,
        default:""
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    authType: {
        type: String,
        enum:["local", "google"],
        default: "local",
    },
    otp: {
        type: String,
    },
    otpExpires:{
        type: Date,
    },
    resetToken:{
        type: String,
    },
    resetTokenExpires:{
        type: Date,
    },
},
{
    timestamps: true,
}
)

const User=mongoose.model("user", userSchema)

export default User