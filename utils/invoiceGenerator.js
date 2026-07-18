import PDFDocument from "pdfkit";

export const generateInvoice = (order, res) => {
    // Standard margins and setup
    const doc = new PDFDocument({
        margin: 50,
        size: "A4"
    });

    doc.pipe(res);

    // Color Palette
    const primaryColor = "#7a56f5"; // OneMore Neon Purple
    const textColor = "#333333";
    const lightGray = "#f4f4f5";
    const borderGray = "#e4e4e7";

    // --- HEADER / BRANDING ---
    doc
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .fontSize(26)
        .text("OneMore", 50, 50);

    doc
        .fillColor(textColor)
        .font("Helvetica")
        .fontSize(10)
        .text("E-Commerce Portal", 50, 80)
        .text("support@onemore.com", 50, 93);

    // Invoice Meta (Top Right Align)
    doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .fillColor(primaryColor)
        .text("INVOICE", 350, 50, {align: "right", width: 195});

    doc
        .fillColor(textColor)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(`Invoice No: `, 350, 75, {align: "right", width: 100})
        .font("Helvetica")
        .text(`${order.orderId}`, 450, 75, {align: "right", width: 95});

    doc
        .font("Helvetica-Bold")
        .text("Order Date: ", 350, 90, {align: "right", width: 100})
        .font("Helvetica")
        .text(`${new Date(order.createdAt).toLocaleDateString()}`, 450, 90, {align: "right", width: 95});

    doc
        .font("Helvetica-Bold")
        .text("Payment: ", 350, 105, {align: "right", width: 100})
        .font("Helvetica")
        .text(`${order.paymentMethod}`, 450, 105, {align: "right", width: 95});

    // Draw thin structural rule
    doc
        .strokeColor(borderGray)
        .lineWidth(1)
        .moveTo(50, 135)
        .lineTo(545, 135)
        .stroke();

    // --- BILLING ADDRESS ---
    doc
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("BILL TO:", 50, 155);

    doc
        .fillColor(textColor)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(order.address.name, 50, 175);

    doc
        .font("Helvetica")
        .fontSize(10);

    doc.text(order.address.houseName, 50, 190);
    doc.text(order.address.street);
    doc.text(`${order.address.city}, ${order.address.state}`);
    doc.text(`${order.address.country} - ${order.address.pincode}`);
    doc.text(`Phone: ${order.address.phone}`);

    // --- PRODUCTS TABLE ---
    const tableTop = 300;

    // Table Header Background
    doc
        .rect(50, tableTop, 495, 25)
        .fill(primaryColor);

    // Table Header Text
    doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(10);

    doc.text("Product Details", 60, tableTop + 7, {width: 220});
    doc.text("Qty", 290, tableTop + 7, {width: 40, align: "center"});
    doc.text("Price", 340, tableTop + 7, {width: 90, align: "right"});
    doc.text("Total", 440, tableTop + 7, {width: 95, align: "right"});

    let currentY = tableTop + 25;

    // Loop Items
    order.items.forEach((item, index) => {
        // Alternate row background
        if (index % 2 === 0) {
            doc
                .save()
                .rect(50, currentY, 495, 30)
                .fill(lightGray)
                .restore();
        }

        // Row Border
        doc
            .strokeColor(borderGray)
            .lineWidth(0.5)
            .rect(50, currentY, 495, 30)
            .stroke();

        // Row text
        doc
            .fillColor(textColor)
            .font("Helvetica")
            .fontSize(9);

        // Product Title Block
        doc.text(
            `${item.productName} (${item.variantName})`,
            60,
            currentY + 10,
            {width: 220, height: 15, ellipsis: true}
        );

        // Quantity
        doc.text(
            item.quantity.toString(),
            290,
            currentY + 10,
            {width: 40, align: "center"}
        );

        // Price
        doc.text(
            `INR ${Number(item.salePrice).toFixed(2)}`,
            340,
            currentY + 10,
            {width: 90, align: "right"}
        );

        // Total
        doc.text(
            `INR ${Number(item.salePrice * item.quantity).toFixed(2)}`,
            440,
            currentY + 10,
            {width: 95, align: "right"}
        );

        currentY += 30;
    });

    // ===========================
    // ORDER SUMMARY
    // ===========================
    currentY += 20;
    const summaryX = 305;
    const summaryY = currentY;
    const summaryWidth = 240;
    const summaryHeight = 110;

    // Background
    doc
        .save()
        .roundedRect(summaryX, summaryY, summaryWidth, summaryHeight, 6)
        .fill("#f8f8fb")
        .restore();

    // Border
    doc
        .roundedRect(summaryX, summaryY, summaryWidth, summaryHeight, 6)
        .lineWidth(1)
        .stroke(borderGray);

    // Heading
    doc
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Order Summary", summaryX + 15, summaryY + 12);

    // Reset font
    doc
        .fillColor(textColor)
        .font("Helvetica")
        .fontSize(10);

    let lineY = summaryY + 40;

    // Subtotal
    doc.text("Subtotal", summaryX + 15, lineY);
    doc.text(
        `INR ${Number(order.subTotal).toFixed(2)}`,
        summaryX + 140,
        lineY,
        {
            width: 80,
            align: "right"
        }
    );

    lineY += 20;

    // Shipping
    doc.text("Shipping", summaryX + 15, lineY);
    const shippingText =
        Number(order.shipping) === 0
            ? "FREE"
            : `INR ${Number(order.shipping).toFixed(2)}`;
    doc.text(
        shippingText,
        summaryX + 140,
        lineY,
        {
            width: 80,
            align: "right"
        }
    );

    lineY += 20;

    // Discount
    doc.text("Discount", summaryX + 15, lineY);
    doc.text(
        `INR ${Number(order.discount).toFixed(2)}`,
        summaryX + 140,
        lineY,
        {
            width: 80,
            align: "right"
        }
    );

    // Divider
    lineY += 25;
    doc
        .moveTo(summaryX + 15, lineY)
        .lineTo(summaryX + summaryWidth - 15, lineY)
        .stroke(borderGray);

    lineY += 12;

    // Grand Total
    doc
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .fontSize(12);
    doc.text("Grand Total", summaryX + 15, lineY);
    doc.text(
        `INR ${Number(order.grandTotal).toFixed(2)}`,
        summaryX + 120,
        lineY,
        {
            width: 100,
            align: "right"
        }
    );

    // --- FOOTER NOTE ---
    const footerY = 730; // Positions safely near bottom of standard A4

    doc
        .strokeColor(primaryColor)
        .lineWidth(1.5)
        .moveTo(50, footerY - 15)
        .lineTo(545, footerY - 15)
        .stroke();

    doc
        .fillColor(textColor)
        .font("Helvetica-Oblique")
        .fontSize(10)
        .text("Thank you for shopping with OneMore!", 50, footerY, {align: "center", width: 495});

    doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#999999")
        .text("This is a system generated invoice and does not require a physical signature.", 50, footerY + 15, {align: "center", width: 495});

    doc.end();
};