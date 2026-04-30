export const getAdminLogin = (req, res) => {
    res.render("admin/login", {error: null})
}

export const postAdminLogin = (req, res) =>{
    const {email, password} = req.body

    if(!email || !password){
        return res.render("admin/login", {
            error: "All fields are required"
        })
    }

    if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
     req.session.admin = true
     return res.redirect("/admin/dashboard")   
    }
    
    return res.render("admin/login", {
        error: "Invalid email or password"
    })
}

export const adminLogout = (req, res) =>{
    
    req.session.admin = null
    res.redirect("/admin/login")
}