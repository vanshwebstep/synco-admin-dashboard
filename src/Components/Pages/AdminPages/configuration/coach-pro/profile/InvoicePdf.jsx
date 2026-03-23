import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import headerBg from "/reportsIcons/invoiceBg.png";
import { Download } from "lucide-react";

const InvoicePdf = () => {
    const generatePDF = () => {
        const doc = new jsPDF("p", "pt", "a4");

        doc.addImage(headerBg, "PNG", 0, 0, 595.28, 200);
        let currentY = 30;

        doc.setFont("helvetica", "bold");
        doc.setTextColor("#fff");

        doc.setFontSize(22);
        doc.text("INVOICE", 40, currentY);
        doc.setFont("helvetica", "normal");
        currentY += 25;

        doc.setFontSize(14);
        doc.text("Date", 40, currentY);
        currentY += 35;

        doc.setFontSize(13);
        doc.text("Bill to", 40, currentY);
        currentY += 17;

        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text("SAMBA SOCCER SCHOOLS GLOBAL LTD", 40, currentY);
        currentY += 17;
        doc.setFont("helvetica", "normal");
        doc.text("65-69 Shelton Street", 40, currentY);
        currentY += 17;
        doc.text("London", 40, currentY);
        currentY += 17;
        doc.text("WC2H 9HE", 40, currentY);
        currentY += 17;
        doc.text("02072052723", 40, currentY);

        doc.setFontSize(13);
        doc.text("Coaches Name", 350, 90);
        doc.setFontSize(13);
        doc.text("Address", 350, 107);
        doc.text("City", 350, 122);
        doc.text("Post Code", 350, 137);
        doc.text("Telephone", 350, 153);
        const tableStartY = 220;

        autoTable(doc, {
            startY: tableStartY,
            head: [["Description", "Venue", "Sessions", "Date", "Total"]],
            body: [
                ["Football coaching services", "Acton", "5", "01/04/2023 – 01/05/2023", "£120.00"],
                ["Session 1", "Address", "", "1st May, 2023 11:00", "£15.00"],
                ["Session 2", "Address", "", "1st May, 2023 11:00", "£30.00"],
                ["Session 3", "Address", "", "1st May, 2023 11:00", "£40.00"],
                ["Session 4", "Address", "", "1st May, 2023 11:00", "£15.00"],
                ["Session 5", "Address", "", "1st May, 2023 11:00", "£30.00"],
                ["Football coaching services", "Acton", "5", "01/04/2023 – 01/05/2023", "£120.00"],
                ["Session 1", "Address", "", "1st May, 2023 11:00", "£15.00"],
                ["Session 2", "Address", "", "1st May, 2023 11:00", "£30.00"],
                ["Session 3", "Address", "", "1st May, 2023 11:00", "£40.00"],
                ["Session 4", "Address", "", "1st May, 2023 11:00", "£15.00"],
                ["Session 5", "Address", "", "1st May, 2023 11:00", "£30.00"],
            ],
            theme: "plain",
            styles: {
                fontSize: 12,
                cellPadding: { top: 10, bottom: 10, left: 6, right: 6 },
                textColor: "#6E7985",
                lineWidth: 0,
                lineColor: [255, 255, 255],
            },

            headStyles: {
                fillColor: [255, 255, 255],
                textColor: "#2F5FE5",
                halign: "left",
                lineWidth: 0,
                cellPadding: { top: 10, bottom: 10 },
            },

            didParseCell: function (data) {

                if (
                    data.section === "body" &&
                    data.row.raw[0] === "Football coaching services"
                ) {
                    data.cell.styles.fillColor = "#F4F7FD";
                    data.cell.styles.textColor = "#323C47";
                }
            },
            didDrawCell: function (data) {

                if (data.section === "head" && data.row.index === 0) {
                    const { doc, cell } = data;
                    const x = cell.x;
                    const y = cell.y + cell.height;
                    const width = cell.width;

                    doc.setLineWidth(4);
                    doc.setDrawColor("#3364D8");
                    doc.line(x, y, x + width, y);
                }
            },
        });
        let finalY = doc.lastAutoTable.finalY + 30;
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;
        doc.setDrawColor('#3364D8');
        doc.setLineWidth(2);
        doc.line(40, finalY - 10, pageWidth - 40, finalY - 10);

        finalY = finalY + 20;
        doc.setTextColor("#323C47");
        doc.setFontSize(15);
        doc.text("Total", 40, finalY);
        doc.text("£860.00", 550, finalY, { align: "right" });


        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");

        doc.text(
            "Please make payment via Bank Transfer using the details below",
            centerX,
            finalY + 40,
            { align: "center" }
        );

        doc.text(
            "Account Number: XX-XX-XX",
            centerX,
            finalY + 60,
            { align: "center" }
        );

        doc.text(
            "Account Number: XXXXXXXXXX",
            centerX,
            finalY + 75,
            { align: "center" }
        );

        doc.save("invoice.pdf");

    };

    return (
        <button
            onClick={generatePDF}
            className="bg-[#237FEA] flex items-center gap-2 p-1.5 px-3 rounded-xl text-white"
        >
            <Download className="w-5" /> Download Invoice
        </button>
    );
};

export default InvoicePdf;
