export const isAdminLoggedIn = (req, res, next) =>{
    if(req.session.admin){
        next()
    } else{
        return res.redirect("/admin/login")
    }
}

export const isAdminLoggedOut = (req, res, next) =>{
    if(!req.session.admin){
        next()
    } else{
        return res.redirect("/admin/dashboard")
    }
}