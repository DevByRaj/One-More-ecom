import User from "../models/userModel.js"
import Address from "../models/addressModel.js"

export const getAdminLogin = (req, res) => {
 res.render("admin/login", {error: null})
}

export const postAdminLogin = (req, res) => {
 const {email, password} = req.body

 if (!email || !password) {
  return res.render("admin/login", {
   error: "All fields are required"
  })
 }

 if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
  req.session.admin = true
  return res.redirect("/admin/dashboard")
 }

 return res.render("admin/login", {
  error: "Invalid email or password"
 })
}

export const adminLogout = (req, res) => {

 req.session.admin = null
 res.redirect("/admin/login")
}

export const getUsers = async (req, res) => {
 try {

  const page = parseInt(req.query.page) || 1
  const limit = 6
  const skip = (page - 1) * limit

  const search = (req.query.search || "").trim()
  const status = req.query.status || ""

  let query = {}

  if (search) {
   query.$or = [
    {name: {$regex: search, $options: "i"}},
    {email: {$regex: search, $options: "i"}}
   ]
  }
  if (status === "blocked") {
   query.isBlocked = true;
  } else if (status === "active") {
   query.isBlocked = false
  }

  const totalUsers = await User.countDocuments(query)

  const users = await User.find(query).sort({createdAt: -1}).skip(skip).limit(limit).lean()

  for (let user of users) {
   const address = await Address.findOne({userId: user._id, isDefault: true})

   user.address = address ? `${address.houseName}, ${address.city}` : "No Address"
  }

//   console.log("USERS:", users);

  const totalPages = Math.ceil(totalUsers / limit)

  res.render("admin/users", {
   users,
   currentPage: page,
   totalPages,
   search,
   status
  })

 } catch (error) {

  console.log(error)

  res.render("admin/users", {
   users: [],
   currentPage: 1,
   totalPages: 1,
   search: "",
   error: "Faild to load User"
  })
 }
}

export const toggleUserBlock = async (req, res) => {
 try {
  const userId = req.params.id

  const user = await User.findById(userId)

  if (!user) {
   return res.redirect("/admin/users")
  }

  user.isBlocked = !user.isBlocked

  await user.save()

  res.redirect("/admin/users")

 } catch (error) {
  console.log(error);

  res.redirect("/admin/users")

 }
}