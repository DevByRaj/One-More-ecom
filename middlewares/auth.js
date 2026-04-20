export const isUserLoggedIn = (req, res, next) =>{
    if(req.session.user){
        return next();
    }
    else{
        return res.redirect("/login")
    }
}

export const isUserLoggedOut = (req, res, next) =>{
    if(!req.session.user){
        return next()
    } else{
        return res.redirect("/")
    }
}