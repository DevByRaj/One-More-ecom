import express from "express"
import {
    getAdminLogin, postAdminLogin,
    adminLogout,
    getUsers,
    toggleUserBlock,
    getCategory,
    getAddCategory, postAddCategory,
    toggleCategoryStatus,
    getEditCategory, postEditCategory,
    getBrand, getAddBrand, postAddBrand,
    toggleBrand,
    getEditBrand, postEditBrand,
    getProducts, getAddProduct, postAddProduct, getEditProduct, postEditProduct,
    toggleProduct,
    getVariants, getAddVariant, 
    postAddVariant, toggleVariantStatus,
    getEditVariant, postEditVariant, getBestSellingProducts, getBestSellingCategories, getBestSellingBrands } from "../controllers/admin/adminController.js"
import {isAdminLoggedIn, isAdminLoggedOut} from "../middlewares/adminAuth.js"
import upload from "../middlewares/multer.js"
import {getOrders, getOrderDetails, updateOrderItemStatus } from "../controllers/admin/orderController.js"
import{ getOfferList, getAddOffer, addOffer, getEditOffer, updateOffer, deleteOffer} from "../controllers/admin/offerController.js"
import { getCouponList, getAddCoupon, createCoupon, getEditCoupon, updateCoupon,deleteCoupon } from "../controllers/admin/couponcontroller.js"
import {getSalesReport, downloadSalesReportPdf, downloadSalesReportExcel} from "../controllers/admin/salesReportController.js"
import {getDashboard} from "../controllers/admin/dashboardController.js";
import {getReferralOfferList, getAddReferralOffer, addReferralOffer, getEditReferralOffer,updateReferralOffer, deleteReferralOffer} from "../controllers/admin/referralOfferController.js";

const router = express.Router()

router.get("/login", isAdminLoggedOut, getAdminLogin)
router.post("/login", isAdminLoggedOut, postAdminLogin)

router.get("/logout", adminLogout)

router.get("/dashboard", isAdminLoggedIn, getDashboard)

router.get("/users", isAdminLoggedIn, getUsers)

router.post("/users/toggle-block/:id", isAdminLoggedIn, toggleUserBlock)

router.get("/category", isAdminLoggedIn, getCategory)

router.get("/addCategory", isAdminLoggedIn, getAddCategory)
router.post("/addCategory", isAdminLoggedIn, postAddCategory)

router.post("/listCategory", isAdminLoggedIn, toggleCategoryStatus)

router.get("/editCategory", isAdminLoggedIn, getEditCategory)
router.post("/editCategory", isAdminLoggedIn, postEditCategory)

router.get("/brand", isAdminLoggedIn, getBrand)

router.get("/addBrand", isAdminLoggedIn, getAddBrand)
router.post("/addBrand", isAdminLoggedIn, postAddBrand)

router.get("/listbrand", isAdminLoggedIn, toggleBrand)

router.get("/editBrand", isAdminLoggedIn, getEditBrand)
router.post("/editBrand", isAdminLoggedIn, postEditBrand)

router.get("/products", isAdminLoggedIn, getProducts)

router.get("/add-product", isAdminLoggedIn, getAddProduct)
router.post("/add-product", isAdminLoggedIn, upload.single("productImage"), postAddProduct)

router.get("/toggle-product", isAdminLoggedIn, toggleProduct)

router.get("/edit-product/:id", isAdminLoggedIn, getEditProduct)
router.post("/edit-product/:id", isAdminLoggedIn, upload.single("productImage"), postEditProduct)

router.get("/variants/:productId", isAdminLoggedIn, getVariants)
router.get("/add-variant/:productId", isAdminLoggedIn, getAddVariant)
router.post("/add-variant", isAdminLoggedIn,  upload.fields([
    {name: "variantImage0", maxCount: 1},
    {name: "variantImage1", maxCount: 1},
    {name: "variantImage2", maxCount: 1}
]) , postAddVariant)

router.get("/toggle-variant/:id", isAdminLoggedIn, toggleVariantStatus)

router.get("/edit-variant/:id", isAdminLoggedIn, getEditVariant)
router.post("/edit-variant/:id", isAdminLoggedIn, upload.fields([
    {name: "variantImage0", maxCount: 1},
    {name: "variantImage1", maxCount: 1},
    {name: "variantImage2", maxCount: 1}
]), postEditVariant)

router.get("/orders", isAdminLoggedIn, getOrders)

router.get("/orders/:id", isAdminLoggedIn, getOrderDetails)

router.post("/orders/update-item-status", isAdminLoggedIn, updateOrderItemStatus)

router.get("/sales-report", isAdminLoggedIn, getSalesReport)

router.get("/sales-report/download-pdf", isAdminLoggedIn, downloadSalesReportPdf)

router.get("/sales-report/download-excel", isAdminLoggedIn, downloadSalesReportExcel)

router.get("/offers", isAdminLoggedIn, getOfferList);

router.get("/offers/add", isAdminLoggedIn, getAddOffer);
router.post("/offers/add", isAdminLoggedIn, addOffer);

router.get("/offers/edit/:id", isAdminLoggedIn, getEditOffer);
router.post("/offers/edit/:id", isAdminLoggedIn, updateOffer);

router.post("/offers/delete/:id", isAdminLoggedIn, deleteOffer);

router.get("/coupons", isAdminLoggedIn, getCouponList)

router.get("/coupons/add", isAdminLoggedIn,  getAddCoupon)
router.post("/coupons/add", isAdminLoggedIn, createCoupon)

router.get("/coupons/edit/:id", isAdminLoggedIn, getEditCoupon)
router.post("/coupons/edit/:id", isAdminLoggedIn, updateCoupon)

router.post("/coupons/delete/:id", isAdminLoggedIn, deleteCoupon)

router.get("/best-selling-products", isAdminLoggedIn, getBestSellingProducts)

router.get("/best-selling-categories", isAdminLoggedIn, getBestSellingCategories)

router.get("/best-selling-brands", isAdminLoggedIn, getBestSellingBrands)

router.get("/referral-offers", isAdminLoggedIn, getReferralOfferList)

router.get("/referral-offers/add", isAdminLoggedIn, getAddReferralOffer)

router.post("/referral-offers/add", isAdminLoggedIn, addReferralOffer)

router.get("/referral-offers/edit/:id", isAdminLoggedIn, getEditReferralOffer)

router.post("/referral-offers/edit/:id", isAdminLoggedIn, updateReferralOffer)

router.post("/referral-offers/delete/:id", isAdminLoggedIn, deleteReferralOffer)

router.get("/referral-offers", isAdminLoggedIn, getReferralOfferList)

export default router