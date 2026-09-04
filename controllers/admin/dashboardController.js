import Order from "../../models/orderModel.js"
import User from "../../models/userModel.js"
import {
    getBestSellingProductsService,
    getBestSellingCategoriesService,
    getBestSellingBrandsService
} from "../../services/salesReportService.js"

export const getDashboard = async (req, res) => {
    try {

        const year = Number(req.query.year) || new Date().getFullYear()

        const [
            bestSellingProductsResult,
            bestSellingCategoriesResult,
            bestSellingBrandsResult
        ] = await Promise.all([
            getBestSellingProductsService(1, 10),
            getBestSellingCategoriesService(1, 10),
            getBestSellingBrandsService(1, 10)
        ])

        const bestSellingProducts = bestSellingProductsResult.products
        const bestSellingCategories = bestSellingCategoriesResult.categories
        const bestSellingBrands = bestSellingBrandsResult.brands
        const filter = req.query.filter || "yearly"

        if(filter === "yearly"){

            const startDate = new Date(year, 0, 1)

            const endDate = new Date(year + 1, 0, 1)

            const orders = await Order.find({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                paymentStatus:{
                    $in: ["Paid", "Pending"]
                }
            })

            let totalRevenue = 0
            let totalOrders = 0
            let productsSold = 0

            const monthlySales = Array.from({length: 12}, (_, index) =>({
                month: index,
                revenue: 0,
                orders: 0,
                productsSold: 0
            }))
            
            for(const order of orders){
                const validItems = order.items.filter(item =>
                    item.status !== "Cancelled" &&
                    item.status !== "Returned"
                )

                if(validItems.length === 0){
                    continue
                }

                totalOrders++

                const month = new Date(order.createdAt).getMonth()

                let orderRevenue = 0
                let orderProducts = 0

                for(const item of validItems){
                    const itemRevenue = Number(item.totalPrice || 0)

                    const quantity = Number(item.quantity || 0)

                    totalRevenue += itemRevenue
                    productsSold += quantity
                    orderRevenue += itemRevenue
                    orderProducts += quantity
                }
                monthlySales[month].revenue += orderRevenue

                monthlySales[month].productsSold += orderProducts

                monthlySales[month].orders++
            }

            const totalCustomers = await User.countDocuments()

            return res.render("admin/dashboard", {
                totalRevenue,
                totalOrders,
                productsSold,
                totalCustomers,
                monthlySales,
                selectedYear: year,
                filter,
                currentPage: "dashboard",

                bestSellingProducts,
                bestSellingCategories,
                bestSellingBrands
            })
        }

        if(filter === "monthly"){

            const month = Number(req.query.month)

            const selectedMonth = Number.isInteger(month) && month >= 0 && month <= 11 ? month: new Date().getMonth()

            const startDate = new Date(year, selectedMonth, 1)

            const endDate = new Date(year, selectedMonth + 1, 1)

            const orders = await Order.find({createdAt: {
                $gte: startDate,
                $lt: endDate
            },
            paymentStatus:{
                $in: ["Paid", "Pending"]
            }
        })

            const dailySales = Array.from({length:new Date(
                year, selectedMonth + 1,0).getDate()
                },(_, index) => ({
                day: index + 1,
                revenue: 0,
                orders: 0,
                productsSold: 0
                })
            )

            let totalRevenue = 0
            let totalOrders = 0
            let productsSold = 0

            for(const order of orders){

                const validItems = order.items.filter(item =>
                    item.status !== "Cancelled" && item.status !== "Returned"
                )

                if(validItems.length === 0){
                    continue
                }
                totalOrders ++

                const day = new Date(order.createdAt).getDate()

                let orderRevenue = 0
                let orderProducts = 0

                for(const item of validItems){
                    const itemRevenue = Number(item.totalPrice || 0)

                    const quantity = Number(item.quantity || 0)

                    totalRevenue += itemRevenue
                    productsSold += quantity
                    orderRevenue += itemRevenue
                    orderProducts += quantity
                }

                dailySales[day - 1].revenue += orderRevenue

                dailySales[day -1].productsSold += orderProducts

                dailySales[day - 1].orders++
            }

            const totalCustomers = await User.countDocuments()

            return res.render("admin/dashboard", {
                totalRevenue,
                totalOrders,
                productsSold,
                totalCustomers,
                monthlySales: dailySales,
                selectedYear: year,
                filter,
                currentPage: "dashboard",

                bestSellingProducts,
                bestSellingCategories,
                bestSellingBrands
            })
        }

        if(filter === "weekly"){
            const today = new Date()

            const endDate = new Date(today)

            endDate.setHours(23, 59, 59, 999)

            const startDate = new Date(today)

            startDate.setDate(startDate.getDate() - 6)

            startDate.setHours(0, 0, 0, 0)

            const orders = await Order.find({
                createdAt:{
                    $gte: startDate,
                    $lte: endDate
                },
                paymentStatus: {
                    $in:["Paid", "Pending"]
                }
            })

            const weeklySales = Array.from({length: 7},
                (_, index) => ({
                    day: index,
                    revenue: 0,
                    orders: 0,
                    productsSold: 0
                }))

                let  totalRevenue = 0
                let totalOrders = 0
                let productsSold = 0

                for(const order of orders){
                    const validItems =  order.items.filter(item =>
                        item.status !== "Cancelled" &&
                        item.status !== "Returned"
                    )
                    if (validItems.length === 0) {
                        continue;
                    }
                    totalOrders++

                    const orderDate = new Date(order.createdAt)

                    const dayIndex = Math.floor(
                        (orderDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                    )

                    if(dayIndex < 0 || dayIndex > 6){
                        continue
                    }

                    let orderRevenue = 0
                    let orderProducts = 0

                    for(const item of validItems){
                        const itemRevenue = Number(item.totalPrice || 0)

                        const quantity = Number(item.quantity || 0)

                        totalRevenue += itemRevenue
                        productsSold += quantity
                        orderRevenue += itemRevenue
                        orderProducts += quantity
                    }

                    weeklySales[dayIndex].revenue += orderRevenue
                    weeklySales[dayIndex].productsSold += orderProducts
                    weeklySales[dayIndex].orders++
                }

                const totalCustomers = await User.countDocuments()

            return res.render("admin/dashboard", {
                totalRevenue,
                totalOrders,
                productsSold,
                totalCustomers,
                monthlySales: weeklySales,
                selectedYear: year,
                filter,
                currentPage: "dashboard",

                bestSellingProducts,
                bestSellingCategories,
                bestSellingBrands
            })
        }

        return res.redirect(`/admin/dashboard?year=${year}&filter=yearly`)
        
    } catch (error) {

        console.log("DASHBOARD ERROR:", error);

        return res.status(500).send("Dashboard Error");
    }
}