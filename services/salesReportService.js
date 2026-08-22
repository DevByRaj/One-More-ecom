import Order from "../models/orderModel.js"

export const getSalesReportService = async(startDate, endDate) =>{

    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const orders = await Order.find({
        createdAt:{
            $gte: start,
            $lte: end
        },
        paymentStatus: {
            $in: ["Paid", "Pending"]
        }
    })

    let totalSales = 0
    let totalOrders = 0
    let couponDiscount = 0
    let offerDiscount = 0

    for(const order of orders){
        
        let validItems = order.items.filter(items =>
            item.status !== "Cancelled" &&
            item.status !== "Returned"
        )

        if(validItems.length === 0){
            continue
        }

        totalOrders++

        for(const item of validItems){

            totalSales += item.totalPrice || 0
            offerDiscount += item.offerDiscount || 0
        }

        couponDiscount += order.discount || 0
    }
    return{
        totalSales,
        totalOrders,
        couponDiscount,
        offerDiscount,
        netRevenue: totalSales
    }
}