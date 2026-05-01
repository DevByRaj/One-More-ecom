import User from "../models/userModel.js";

export const isUserLoggedIn = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    else {
        return res.redirect("/login")
    }
}

export const isUserLoggedOut = (req, res, next) => {
    if (!req.session.user) {
        return next()
    } else {
        return res.redirect("/")
    }
}

export const checkBlockedUser = async (req, res, next) => {
    try {

        if (!req.session || !req.session.user) {
            return next()
        }

        const user = await User.findById(req.session.user)

        if (user && user.isBlocked) {
            return req.session.destroy(() => {
                return res.redirect("/login?error=blocked")
            })
        } else {
            next()
        }

    } catch (error) {
        console.log(error);
        next()

    }
}