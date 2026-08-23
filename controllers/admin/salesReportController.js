import {getSalesReportService} from "../../services/salesReportService.js";

const formatDate = (date) => {

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
}

export const getSalesReport = async (req, res) => {

    try {

        const today = new Date()

        const filter = req.query.filter || "daily"

        const page = Number(req.query.page) || 1

        let startDate
        let endDate


        if (filter === "daily") {

            startDate = new Date(today)

        } else if (filter === "weekly") {

            startDate = new Date(today)

            startDate.setDate(
                today.getDate() - 6
            )

        } else if (filter === "monthly") {

            startDate = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            )

        } else if (filter === "yearly") {

            startDate = new Date(
                today.getFullYear(),
                0,
                1
            )

        } else if (filter === "custom") {

            if (
                req.query.startDate &&
                req.query.endDate
            ) {

                startDate = new Date(
                    req.query.startDate
                )

                endDate = new Date(
                    req.query.endDate
                )

                // Invalid date protection
                if (
                    isNaN(startDate.getTime()) ||
                    isNaN(endDate.getTime())
                ) {

                    return res.redirect(
                        "/admin/sales-report?filter=custom"
                    )
                }

                // Prevent From Date > To Date
                if (startDate > endDate) {

                    return res.redirect(
                        "/admin/sales-report?filter=custom"
                    )
                }

            } else {

                startDate = new Date(today)
                endDate = new Date(today)

            }

        } else {

            startDate = new Date(today)

        }


        if (!endDate) {

            endDate = new Date(today)

        }


        const startDateString =
            formatDate(startDate)

        const endDateString =
            formatDate(endDate)


        const report =
            await getSalesReportService(
                startDateString,
                endDateString,
                page,
                10
            )


        return res.render(
            "admin/salesReport",
            {

                report,

                startDate:
                    startDateString,

                endDate:
                    endDateString,

                filter,

                currentPage:
                    "sales-report"

            }
        )

    } catch (error) {

        console.log(error)

        return res.redirect(
            "/admin/dashboard"
        )

    }
}