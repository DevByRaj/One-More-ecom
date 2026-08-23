import ExcelJS from "exceljs";

export const generateSalesReportExcel = async (report,startDate,endDate,res) => {

    const workbook = new ExcelJS.Workbook()

    const worksheet = workbook.addWorksheet("Sales Report")


    worksheet.mergeCells("A1:H1")

    const titleCell =
        worksheet.getCell("A1")

    titleCell.value =
        "OneMore - Sales Report"

    titleCell.font = {
        bold: true,
        size: 18
    }

    titleCell.alignment = {
        horizontal: "center"
    }


    worksheet.mergeCells("A2:H2")

    const periodCell =
        worksheet.getCell("A2")

    periodCell.value =
        `Report Period: ${startDate} → ${endDate}`

    periodCell.font = {
        bold: true,
        size: 11
    }

    periodCell.alignment = {
        horizontal: "center"
    }



    worksheet.getCell("A4").value =
        "Total Revenue"

    worksheet.getCell("B4").value =
        Number(report?.netRevenue || 0)


    worksheet.getCell("D4").value =
        "Total Orders"

    worksheet.getCell("E4").value =
        Number(report?.totalOrders || 0)


    worksheet.getCell("G4").value =
        "Total Discount"


    const totalDiscount =
        Number(report?.couponDiscount || 0) +
        Number(report?.offerDiscount || 0)


    worksheet.getCell("H4").value = totalDiscount


    worksheet.getCell("A4").font = {
        bold: true
    }

    worksheet.getCell("D4").font = {
        bold: true
    }

    worksheet.getCell("G4").font = {
        bold: true
    }


    worksheet.getCell("B4").numFmt =
        '₹#,##0.00';

    worksheet.getCell("H4").numFmt =
        '₹#,##0.00';



    const headerRow =
        worksheet.getRow(6)


    headerRow.values = [
        "SL",
        "Username",
        "Address",
        "Quantity",
        "Price",
        "Discounted",
        "Payment Method",
        "Date"
    ]


    headerRow.font = {
        bold: true,
        color: {
            argb: "FFFFFFFF"
        }
    }


    headerRow.alignment = {
        horizontal: "center",
        vertical: "middle"
    }


    for (let column = 1; column <= 8; column++) {

        const cell = headerRow.getCell(column)

        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
                argb: "FF7A56F5"
            }
        }

        cell.border = {
            top: {
                style: "thin"
            },
            bottom: {
                style: "thin"
            },
            left: {
                style: "thin"
            },
            right: {
                style: "thin"
            }
        }
    }


    const sales =
        Array.isArray(report?.sales)
            ? report.sales
            : []


    for (let index = 0; index < sales.length; index++) {

        const sale = sales[index]


        const row =
            worksheet.addRow([
                index + 1,
                sale?.username || "Unknown",
                sale?.address || "N/A",
                Number(sale?.quantity || 0),
                Number(sale?.price || 0),
                Number(sale?.discounted || 0),
                sale?.paymentMethod || "N/A",
                sale?.date
                    ? new Date(sale.date)
                    : null
            ])


        // Price
        row.getCell(5).numFmt =
            '₹#,##0.00';


        // Discounted price
        row.getCell(6).numFmt =
            '₹#,##0.00';


        // Date
        row.getCell(8).numFmt =
            "dd/mm/yyyy"


        for (
            let column = 1; column <= 8; column++) {

            const cell =
                row.getCell(column);

            cell.border = {
                top: {
                    style: "thin"
                },
                bottom: {
                    style: "thin"
                },
                left: {
                    style: "thin"
                },
                right: {
                    style: "thin"
                }
            }
        }
    }

    if (sales.length === 0) {

        const emptyRow =
            worksheet.addRow([
                "",
                "No sales found for this period."
            ])


        worksheet.mergeCells(
            `B${emptyRow.number}:H${emptyRow.number}`
        )


        emptyRow.getCell(2).alignment = {
            horizontal: "center"
        }


        emptyRow.getCell(2).font = {
            italic: true
        }
    }


    worksheet.getColumn(1).width = 8

    worksheet.getColumn(2).width = 20

    worksheet.getColumn(3).width = 28

    worksheet.getColumn(4).width = 12

    worksheet.getColumn(5).width = 15

    worksheet.getColumn(6).width = 18

    worksheet.getColumn(7).width = 18

    worksheet.getColumn(8).width = 15


    worksheet.views = [
        {
            state: "frozen",
            ySplit: 6
        }
    ]

    await workbook.xlsx.write(res)

    res.end()
}