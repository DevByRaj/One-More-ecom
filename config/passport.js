
import passport from "passport"
import { Strategy  as GoogleStrategy} from "passport-google-oauth20"
import User from "../models/userModel.js"
import { sendOtpEmail } from "../services/mailService.js";



passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL:"http://localhost:3000/auth/google/callback",
            
        },
        async(accessToken, refreshToken, profile, done) =>{
            try {
                const email = profile.emails[0].value;

                if(!email){
                    return done(new Error("No email found from Google"), null)
                }
                let user = await User.findOne({email})

                const otp = Math.floor(1000 + Math.random() * 9000).toString()

                if(!user){
                    user = new User({
                        name: profile.displayName,
                        email,
                        authType: "google",
                        isVerified: false,
                        otp,
                        otpExpires: Date.now()+ 2 * 60 * 1000
                    })

                    await user.save()
                    await sendOtpEmail(email, otp)
                } else {
                    
                    if(user.isVerified){
                        return done(null, user)
                    }

                    const otp = Math.floor(1000+Math.random()*9000).toString()

                    user.otp = otp
                    user.otpExpires = Date.now()+2*60*1000

                    await user.save()

                await sendOtpEmail(email,otp)

                }
                
                return done(null, user)
                
            } catch (error) {
                return done(error, null)
            }
        }
    )
)

passport.serializeUser((user, done) =>{
    done(null, user.id)
})

passport.deserializeUser(async(id, done) => {
    const user= await User.findById(id)
    done(null, user)
})
