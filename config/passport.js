import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/userModel.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        if (!email) {
          return done(new Error("No email from Google"), null)
        }

        let user = await User.findOne({ email })

        if (user) {

          if (user.authType !== "google") {
            return done(null, false, {
              message: "Please login using email & password",
            });
          }

          return done(null, user);
        }

        user = new User({
          name: profile.displayName,
          email,
          authType: "google",
          isVerified: true,
          profileImage: profile.photos?.[0]?.value || ""
        });

        await user.save()

        return done(null, user)

      } catch (error) {
        return done(error, null)
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id)
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (error) {
    done(error, null)
  }
});

export default passport