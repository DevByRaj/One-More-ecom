import Coupon from "../models/couponModel.js";

export const getCouponListService = async(page, limit, search) =>{

    const skip = (page - 1) * limit

    const filter = {}

    if(search){
        filter.couponCode ={
            $regex: search,
            $options: "i"
        }
    }

    const coupons = await Coupon.find(filter).sort({createdAt: -1}).skip(skip).limit(limit)

    const totalCoupons = await Coupon.countDocuments(filter)

    const totalPages = Math.ceil(totalCoupons / limit)

    return{
        coupons,
        totalPages
    }
}

export const createCouponService = async (couponData) =>{
    
    const{
        couponCode,
        description,
        discountType,
        discountValue,
        minimumPurchase,
        maximumDiscount,
        startDate,
        endDate,
        usageLimit,
        isActive
    } = couponData

    const existingCoupon = await Coupon.findOne({
        couponCode: couponCode.trim().toUpperCase()
    })

    if(existingCoupon){
        return{
            success: false,
            message: "Coupon code already exists"
        }
    }

    const coupon = await Coupon.create({
        couponCode: couponCode.trim().toUpperCase(),
        description: description?.trim() || "",
        discountType,
        discountValue: Number(discountValue),
        minimumPurchase: Number(minimumPurchase) || 0,

        maximumDiscount: maximumDiscount !== "" ? Number(maximumDiscount) : null,

        startDate,
        endDate,
        usageLimit: usageLimit !== "" ? Number(usageLimit): null,
        usedCount: 0,
        isActive: isActive === "on" || isActive === true
    })

    return {
        success: true,
        coupon
    }
}