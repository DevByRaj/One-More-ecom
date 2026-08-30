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
            required: false,
        },
        phone: {
            type: String,
            default: "",
        },
        profileImage: {
            type: String,
            default: ""
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
            enum: ["local", "google"],
            default: "local",
        },

        referralCode: {
            type: String,
            unique: true,
            sparse: true
        },

        referredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        otp: {
            type: String,
        },

        otpExpires: {
            type: Date,
        },
        
        resetToken: {
            type: String,
        },
        resetTokenExpires: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
)
userSchema.pre("save", async function () {

    if (!this.isNew || this.referralCode) {
        return
    }

    let code
    let existingUser

    do {
        code = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase()

        existingUser = await mongoose.models.User.findOne({
            referralCode: code
        })

    } while (existingUser)

    this.referralCode = code
})

const User = mongoose.model("User", userSchema)

export default User