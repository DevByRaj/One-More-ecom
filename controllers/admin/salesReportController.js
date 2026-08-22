import {getSalesReportService} from "../../services/salesReportService.js"

export const getSalesReport = async (req, res) => {
    try {

        const today = new Date()

        const startDate = req.query.startDate ? req.query.startDate : today.toISOString().split("T")[0]

        const endDate = req.query.endDate ? req.query.endDate : today.toISOString().split("T")[0]

        const report = await getSalesReportService(startDate, endDate)

        return res.render("admin/salesReport",{
            report,
            startDate,
            endDate
        })

    } catch (error) {
        
        console.log(error);
        return res.redirect("/admin.dashboard")

    }
}