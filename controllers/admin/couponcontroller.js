import { getCouponListService, 
    createCouponService, 
    getCouponByIdService, 
    updateCouponService,
    deleteCouponService } from "../../services/couponService.js";

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
            coupon: null,
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
                coupon:null,
                error: result.message
            })
        }

        return res.redirect("/admin/coupons")
    } catch(error){
        console.log(error);

        return res.render("admin/addCoupon", {
            coupon:null,
            error: "Something went wrong"
        })
        
    }
}

export const getEditCoupon = async(req, res) =>{
    try {

        const {id} = req.params

        const result = await getCouponByIdService(id)
        
        if(!result.success){
            return res.redirect("/admin/coupons")
        }

        return res.render("admin/addCoupon",{
            coupon: result.coupon,
            error: null
        })
        
    } catch (error) {
        console.log(error);
        
        return res.redirect("/admin/coupons")
    }
}

export const updateCoupon = async(req, res) =>{
    try {

        const {id} = req.params

        const result = await updateCouponService(id, req.body)

        if(!result.success){

            return res.render("admin/addCoupon", {
                coupon:{
                    _id: id,
                    ...req.body
                },
                error: result.message
            })
        }

        return res.redirect("/admin/coupons")
        
    } catch (error) {

        console.log(error);
        
        return res.render("admin/addCoupon",{
            coupon:{
                _id: req.params.id,
                ...req.body
            },
            error: "Something went wrong"
        })
        
    }
}

export const deleteCoupon = async (req, res) =>{
    try {

        const {id} = req.params

        const result = await deleteCouponService(id)

        if(!result.success){
            return res.redirect("/admin/coupons")
        }

        return res.redirect("/admin/coupons")
        
    } catch (error) {
        console.log(error);

        return res.redirect("/admin/coupons")
        
    }
}

