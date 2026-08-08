import { getCouponListService, createCouponService } from "../../services/couponService.js";

export const getCouponList = async (req, res) =>{
    try {

        const page = parseInt(req.query.page) || 1

        const limit = 5
        
        const search = req.query.search || ""

        const result = await getCouponListService(page, limit, search)

        return res.render("admin/couponList", {
             coupons: result.coupons,
             totalPages: result.totalPages,
             currentPage: page,
             searchQuery: search  
        })
        
    } catch (error) {

        console.log(error);
        
        return res.redirect("/admin/dashboard")
    }
}

export const getAddCoupon = async(req, res) =>{
    try {

        return res.render("admin/addCoupon", {
            error: null
        })
        
    } catch (error) {
        console.log(error);
        
        return res.redirect("/admin/coupons")
    }
}

export const createCoupon = async(req,res) =>{
    try{
        const result = await createCouponService(req.body)

        if(!result.success){
            return res.render("admin/addCoupon",{
                error: result.message
            })
        }

        return res.redirect("/admin/coupons")
    } catch(error){
        console.log(error);

        return res.render("admin/addCoupon", {
            error: "Something went wrong"
        })
        
    }
}