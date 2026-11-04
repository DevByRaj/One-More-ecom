import logger from "../../utils/logger.js";
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

        const successMessage = req.session.successMessage
        delete req.session.successMessage

        return res.render("admin/couponList", {
             coupons: result.coupons,
             totalPages: result.totalPages,
             currentPage: page,
             searchQuery: search,
             successMessage: successMessage || null
        })
        
    } catch (error) {
        logger.error("Failed to fetch admin coupon list",{
            message: error.message,
            stack: error.stack
        })
        
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
        logger.error("Failed to load add coupon page", {
            message: error.message,
            stack: error.stack
        })
        
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

        req.session.successMessage = "Coupon created successfully"
        return res.redirect("/admin/coupons")
    } catch(error){
        logger.error("Failed to create coupon", {
            message: error.message,
            stack: error.stack
        })

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
        logger.error("Failed to load edit coupon page", {
            message: error.message,
            stack: error.stack
        })

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
        req.session.successMessage = "Coupon updated successfully"
        return res.redirect("/admin/coupons")
        
    } catch (error) {
        logger.error("Failed to update coupon", {
            message: error.message,
            stack: error.stack
        })

        return res.render("admin/addCoupon", {
            coupon: {
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
        req.session.successMessage = "Coupon deleted successcully"
        return res.redirect("/admin/coupons")
        
    } catch (error) {
        logger.error("Failed to delete coupon", {
            message: error.message,
            stack: error.stack
        })

        return res.redirect("/admin/coupons")
    }
}

