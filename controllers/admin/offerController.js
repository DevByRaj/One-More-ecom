import productModel from "../../models/productModel.js";
import {
    getOfferListService,
    getAddOfferService,
    addOfferService,
    getEditOfferService,
    updateOfferService,
    deleteOfferService
} from "../../services/offerService.js";

export const  getOfferList = async(req, res) =>{
    try {

        const page = Number(req.query.page) || 1

        const result = await getOfferListService(page, 5)

        if(!result.success){
            return res.redirect("/admin/pageerror")
        }

        return res.render("admin/offer", {
            offers: result.offers,
            currentPage: result.currentPage,
            totalPages: result.totalPages
        })
        
    } catch (error) {

        console.log(error);
        return res.redirect("/admin/pageerror")        
    }
}

export const getAddOffer = async(req, res) =>{
    try {

        const result = await getAddOfferService()

        if(!result.success){
            return res.redirect("/admin/offers")
        }

        return res.render("admin/addOffer", {
            products: result.products,
            categories: result.categories,
            isEdit: false,
            offer: null,
            error: null
        })
        
    } catch (error) {
        console.log(error);
        return res.redirect("/admin/pageerror")
    }
}

export const addOffer = async(req, res) =>{
    try {

        const result = await addOfferService(req.body)

        if(!result.success){

            const pageDate = await getAddOfferService()

            return res.render("admin/addOffer",{
                isEdit: false,
                offer: req.body,
                products: pageDate.products,
                categories: pageDate.categories,
                error: result.message
            })
        }

        return res.redirect("/admin/offers")
        
    } catch (error) {
        console.log(error);
        return res.redirect("/admin/pageerror")
    }
}

export const getEditOffer = async(req, res) =>{
    try {

        const {id} = req.params

        const result = await getEditOfferService(id)

        if(!result.success){
            return res.redirect("/admin/offers")
        }

        return res.render("admin/addOffer",{
            isEdit: true,
            offer: result.offer,
            products: result.products,
            categories: result.categories,
            error: null
        })
        
    } catch (error) {
        console.log(error);
        return res.redirect("/admin/pageerror")
    }
}

export const updateOffer = async(req, res) =>{
    try {

        const {id} = req.params

        const result = await updateOfferService(id, req.body)

        if(!result.success){

            const pageData = await getEditOfferService(id)

            return res.render("admin/addOffer", {
                isEdit: true,
                offer:{
                    ...pageData.offer.toObject(),
                    ...req.body
                },
                products: pageData.products,
                categories: pageData.categories,
                error: result.message
            })
        }

        return res.redirect("/admin/offers")
        
    } catch (error) {
        console.log(error)
        return res.redirect("/admin/pageerror")
    }
}

export const deleteOffer = async(req, res) =>{
    try {

        const {id} = req.params
        const result = await deleteOfferService(id)

        if(!result.success){
            return res.redirect("/admin/offers")
        }

        return res.redirect("/admin/offers")
        
    } catch (error) {
        console.log(error);
        return res.redirect("/admin/pageerror")
    }
}