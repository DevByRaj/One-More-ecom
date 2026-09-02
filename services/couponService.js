import Coupon from "../models/couponModel.js";
import Order from "../models/orderModel.js"

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

    const discount = Number(discountValue)

    const minimum = Number(minimumPurchase)

    if (discount <= 0) {
        return {
            success: false,
            message: "Discount value must be greater than 0"
        }
    }

    if (minimum < 0) {
        return {
            success: false,
            message: "Minimum purchase cannot be negative"
        }
    }

    if (discountType === "PERCENTAGE" && discount > 100) {
        return {
            success: false,
            message: "Percentage discount cannot be more than 100%"
        }
    }

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
        discountValue: discount,
        minimumPurchase: minimum,

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

export const getCouponByIdService = async (couponid) =>{

    const coupon = await Coupon.findById(couponid)

    if(!coupon){
        return{
            success: false,
            message: "Coupon not found"
        }
    }
    return{
        success: true,
        coupon
    }
}

export const updateCouponService = async(couponId, couponData) =>{

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

    const discount = Number(discountValue)
    const minimum = Number(minimumPurchase)

    if (discount <= 0) {
        return {
            success: false,
            message: "Discount value must be greater than 0"
        }
    }

    if (minimum < 0) {
        return {
            success: false,
            message: "Minimum purchase cannot be negative"
        }
    }

    if (discountType === "PERCENTAGE" && discount > 100) {
        return {
            success: false,
            message: "Percentage discount cannot be more than 100%"
        }
    }

    const existingCoupon = await Coupon.findOne({
        couponCode: couponCode.trim().toUpperCase(),
        _id: {$ne: couponId}
    })

    if(existingCoupon){
        return{
            success: false,
            message: "Coupon code already exists"
        }
    }

    const coupon = await Coupon.findByIdAndUpdate(
        couponId,
        {
            couponCode: couponCode.trim().toUpperCase(),
            description: description?.trim() || "",
            discountType,
            discountValue: discount,
            minimumPurchase: minimum,
            maximumDiscount:
                maximumDiscount !== ""
                    ? Number(maximumDiscount)
                    : null,
            startDate,
            endDate,
            usageLimit:
                usageLimit !== ""
                    ? Number(usageLimit)
                    : null,
            isActive: isActive === "on" || isActive === true
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    )

    if(!coupon){
        return{
            success: false,
            message: "coupon not found"
        }
    }

    return{
        success: true,
        coupon
    }
}

export const deleteCouponService = async(id) =>{
    try {

        const coupon = await Coupon.findOneAndDelete(id)

        if(!coupon){
            return{
                success: false,
                message: "Coupon not found"
            }
        }

        return{
            success: true
        }
        
    } catch (error) {
        console.log(error);
        
        return{
            success: false,
            message: "Somthing went wrong"
        }
    }
}

export const applyCouponService = async(userId,couponCode, subtotal) =>{

    const coupon = await Coupon.findOne({
        couponCode: couponCode.trim().toUpperCase()
    })

    if(!coupon){
        return{
            success: false,
            message: "Invalid coupon code"
        }
    }

    const alreadyUsed = await Order.findOne({
        userId,
        "coupon.couponId": coupon._id,
        orderStatus: {$ne: "Cancelled"},
        $or: [
            {
                paymentMethod: {$ne: "RAZORPAY"},
                paymentStatus: {$ne: "Failed"}
            },
            {
                paymentMethod: "RAZORPAY",
                paymentStatus: "Paid"
            }
        ]
    })

    if (alreadyUsed) {
        return {
            success: false,
            message: "You have already used this coupon"
        }
    }

    if(!coupon.isActive){
        return{
            success: false,
            message: "Coupon inactive"
        }
    }

    const currentDate = new Date()

    if(currentDate < new Date(coupon.startDate)){
        return{
            success: false,
            message: "Coupon is not active yet"
        }
    }

    if(currentDate > new Date(coupon.endDate)){
        return{
            success: false,
            message: "Coupon Expired"
        }
    }

    if(coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit){
        return{
            success: false,
            message: "Coupon usage limit reached"
        }
    }

    if(subtotal < coupon.minimumPurchase){
        return{
            success: false,
            message: `Minimum purchase amount is ₹${coupon.minimumPurchase}`
        }
    }

    let couponDiscount = 0

    if(coupon.discountType === "PERCENTAGE"){
        
        couponDiscount = subtotal * coupon.discountValue / 100

        if (coupon.maximumDiscount !== null && couponDiscount > coupon.maximumDiscount) {
            couponDiscount = coupon.maximumDiscount
        }
    } else if(coupon.discountType === "FLAT"){

        couponDiscount = coupon.discountValue

        if(couponDiscount > subtotal){
            couponDiscount = subtotal
        }
    }    
    return{
        success: true,
        coupon,
        couponDiscount
    }
}


export const getAvailableCouponsService = async(userId) =>{
    try {

        const currentDate = new Date()

        const usedOrders = await Order.find({
            userId,
            "coupon.couponId": {$ne: null},
            orderStatus: {$ne: "Cancelled"},
            $or: [
                {
                    paymentMethod: {$ne: "RAZORPAY"},
                    paymentStatus: {$ne: "Failed"}
                },
                {
                    paymentMethod: "RAZORPAY",
                    paymentStatus: "Paid"
                }
            ]
        }).select("coupon.couponId")

        const usedCouponIds = usedOrders.map(
            order => order.coupon.couponId
        )
        
        const coupons = await Coupon.find({
            isActive: true,
            startDate: {$lte: currentDate},
            endDate: {$gte: currentDate},
            $or: [
                {usageLimit: null},
                {$expr: {$lt: ["$usedCount", "$usageLimit"]}}
            ],
            _id: {
                $nin: usedCouponIds
            }
        }).sort({createdAt: -1})

        return {
            success: true,
            coupons
        }
        
    } catch (error) {
        console.log(error);
        
        return {
            success: false,
            coupons: []
        }
    }
}