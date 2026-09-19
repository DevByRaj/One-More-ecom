import PDFDocument from "pdfkit";

export const generateSalesReportPdf = (report, startDate, endDate, res) => {

    const doc = new PDFDocument({
        margin: 40,
        size: "A4"
    });

    doc.pipe(res);

    const primaryColor = "#7a56f5";
    const textColor = "#333333";
    const lightGray = "#f4f4f5";
    const borderGray = "#e4e4e7";


    doc
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .fontSize(26)
        .text("OneMore", 40, 40);

    doc
        .fillColor(textColor)
        .font("Helvetica")
        .fontSize(10)
        .text("E-Commerce Portal", 40, 70)
        .text("Sales Report", 40, 84);

    // Report title
    doc
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .fontSize(18)
        .text("SALES REPORT", 350, 45, {
            width: 200,
            align: "right"
        });

    doc
        .fillColor(textColor)
        .font("Helvetica")
        .fontSize(9)
        .text(
            `Period: ${startDate} → ${endDate}`,
            350,
            72,
            {
                width: 200,
                align: "right"
            }
        );

    // Divider
    doc
        .strokeColor(borderGray)
        .lineWidth(1)
        .moveTo(40, 110)
        .lineTo(555, 110)
        .stroke();


    // =========================
    // SUMMARY
    // =========================

    const summaryY = 130;
    const cardWidth = 160;
    const cardHeight = 70;

    // Revenue
    doc
        .roundedRect(40, summaryY, cardWidth, cardHeight, 6)
        .fill("#f8f8fb");

    doc
        .fillColor(textColor)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("TOTAL REVENUE", 52, summaryY + 15);

    doc
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(
            `INR ${Number(report.netRevenue).toFixed(2)}`,
            52,
            summaryY + 35
        );


    // Orders
    doc
        .roundedRect(215, summaryY, cardWidth, cardHeight, 6)
        .fill("#f8f8fb");

    doc
        .fillColor(textColor)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("TOTAL ORDERS", 227, summaryY + 15);

    doc
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(
            `${report.totalOrders}`,
            227,
            summaryY + 35
        );


    // Discount
    const totalDiscount =
        Number(report.couponDiscount || 0) +
        Number(report.offerDiscount || 0);

    doc
        .roundedRect(390, summaryY, cardWidth, cardHeight, 6)
        .fill("#f8f8fb");

    doc
        .fillColor(textColor)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("TOTAL DISCOUNT", 402, summaryY + 15);

    doc
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(
            `INR ${totalDiscount.toFixed(2)}`,
            402,
            summaryY + 35
        );

    let tableTop = 230;

    const columns = {
        sl: 40,
        orderId: 65,
        productName: 145,
        quantity: 300,
        price: 340,
        discounted: 405,
        payment: 475,
        date: 520
    };

    const columnWidths = {
        sl: 25,
        orderId: 80,
        productName: 150,
        quantity: 40,
        price: 65,
        discounted: 70,
        payment: 45,
        date: 35
    };

    const drawTableHeader = (y) => {

        doc
            .rect(40, y, 515, 25)
            .fill(primaryColor);

        doc
            .fillColor("#ffffff")
            .font("Helvetica-Bold")
            .fontSize(7);

        doc.text("SL", columns.sl + 3, y + 8, {
            width: columnWidths.sl
        });

        doc.text("Order ID", columns.orderId, y + 8, {
            width: columnWidths.orderId
        });

        doc.text("Product Name", columns.productName, y + 8, {
            width: columnWidths.productName
        });
        doc.text("Qty", columns.quantity, y + 8, {
            width: columnWidths.quantity,
            align: "center"
        });

        doc.text("Price", columns.price, y + 8, {
            width: columnWidths.price,
            align: "right"
        });

        doc.text("Discounted", columns.discounted, y + 8, {
            width: columnWidths.discounted,
            align: "right"
        });

        doc.text("Payment", columns.payment, y + 8, {
            width: columnWidths.payment
        });

        doc.text("Date", columns.date, y + 8, {
            width: columnWidths.date
        });
    };

    drawTableHeader(tableTop);

    let currentY = tableTop + 25;

    report.sales.forEach((sale, index) => {

        const rowHeight = 32;

        // New page
        if (currentY + rowHeight > 760) {

            doc.addPage();

            currentY = 40;

            drawTableHeader(currentY);

            currentY += 25;
        }

        
        if (index % 2 === 0) {

            doc
                .save()
                .rect(40, currentY, 515, rowHeight)
                .fill(lightGray)
                .restore();
        }

       
        doc
            .strokeColor(borderGray)
            .lineWidth(0.5)
            .rect(40, currentY, 515, rowHeight)
            .stroke();

        doc
            .fillColor(textColor)
            .font("Helvetica")
            .fontSize(7);

        
        doc.text(
            `${index + 1}`,
            columns.sl + 3,
            currentY + 10,
            {
                width: columnWidths.sl
            }
        );

        
    
        doc.text(
            sale.orderId || "N/A",
            columns.orderId,
            currentY + 10,
            {
                width: columnWidths.orderId,
                ellipsis: true
            }
        );

        doc.text(
            sale.productName || "N/A",
            columns.productName,
            currentY + 10,
            {
                width: columnWidths.productName,
                ellipsis: true
            }
        );

        
        doc.text(
            `${sale.quantity}`,
            columns.quantity,
            currentY + 10,
            {
                width: columnWidths.quantity,
                align: "center"
            }
        );

        doc.text(
            `INR ${Number(sale.price || 0).toFixed(2)}`,
            columns.price,
            currentY + 10,
            {
                width: columnWidths.price,
                align: "right"
            }
        );

        doc.text(
            `INR ${Number(sale.discounted || 0).toFixed(2)}`,
            columns.discounted,
            currentY + 10,
            {
                width: columnWidths.discounted,
                align: "right"
            }
        );

        
        doc.text(
            sale.paymentMethod || "N/A",
            columns.payment,
            currentY + 10,
            {
                width: columnWidths.payment,
                ellipsis: true
            }
        );

        doc.text(
            new Date(sale.date).toLocaleDateString("en-IN"),
            columns.date,
            currentY + 10,
            {
                width: columnWidths.date
            }
        );

        currentY += rowHeight;
    });


    const footerY = 800;

    doc
        .strokeColor(primaryColor)
        .lineWidth(1)
        .moveTo(40, footerY - 15)
        .lineTo(555, footerY - 15)
        .stroke();

    doc
        .fillColor(textColor)
        .font("Helvetica-Oblique")
        .fontSize(8)
        .text(
            "This is a system generated sales report.",
            40,
            footerY,
            {
                width: 515,
                align: "center"
            }
        );

    doc.end();
};