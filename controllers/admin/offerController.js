import{
    getProductOfferListService,
    getAddProductOfferService,
    addProductOfferService,
    getEditProductOfferSrvice,
    updateProductOfferService,
    deleteProductOfferService
} from "../../services/offerService.js"

export const getProductOfferList = async(req, res) =>{
    try {

        const result = await getProductOfferListService()

        if(!result.success){
            return res.redirect("/admin/pageerror")
        }

        res.render("admin/productOfferList",{
            offers: result.productOffers
        })
        
    } catch (error) {
        console.log(error);
        res.redirect("/admin/pageerror")
    }
}

export const getAddProductOffer = async(req, res) =>{
     try {
        
     } catch (error) {
        console.log(error);
        res.redirect("/admin/pageerror")
     }
}

export const addProductOffer = async(req, res) =>{
    try {
        
    } catch (error) {
        console.log(error);
        res.redirect("/admin/pegeerror")
    }
}


export const getEditProductOffer = async(req,res) =>{
    try {
        
    } catch (error) {
        console.log(error);
        res.redirect("/admin/ pageerror")
    }
}

export const updateProductOffer = async(req,res) =>{
    try {
        
    } catch (error) {
        console.log(error);
        res.redirect("/admin/pageerror")
    }
}

export const deleteProductOffer = async(req, res) =>{
    try {
        
    } catch (error) {
        console.log(error);
        res.redirect("/admin/pageerror")
    }
}







