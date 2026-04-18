
import passport from "passport"
import { Strategy  as GoogleStrategy} from "passport-google-oauth20"
import User from "../models/userModel.js"



passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL:"/auth/google/callback",
            
        },
        async(accessToken, refreshToken, Profiler, done) =>{
            try {
                const email = Profile.email[0].value;
                let user = await User.findOne({email})

                if(!user){
                    user = new User({
                        name: Profiler.displayName,
                        email,
                        authType: "google",
                        isVerified: true,
                    })

                    await user.save()
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
