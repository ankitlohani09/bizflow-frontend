import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * pdfExportService – Professional PDF generation for invoices and reports
 */
const pdfExportService = {
    /**
     * Generate a pro-quality invoice PDF
     * @param {object} invoice - Complete invoice object including items and customer
     */
    generateInvoicePDF(invoice) {
        const doc = new jsPDF();
        const blue = [37, 99, 235]; // Primary blue (#2563EB)

        // 1. Header & Brand
        doc.setFillColor(...blue);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('BIZFLOW', 20, 25);

        doc.setFontSize(10);
        doc.text('Enterprise ERP Solutions', 20, 32);

        doc.setFontSize(18);
        doc.text('INVOICE', 160, 25, { align: 'right' });

        // 2. Info Grid
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);

        // Bill To
        doc.setFont('helvetica', 'bold');
        doc.text('BILL TO:', 20, 55);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.customerName || 'Walk-in Customer', 20, 60);
        doc.text(invoice.customerEmail || '', 20, 65);

        // Invoice Details
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE NO:', 130, 55);
        doc.text('DATE:', 130, 60);
        doc.text('STATUS:', 130, 65);

        doc.setFont('helvetica', 'normal');
        doc.text(`#INV-${invoice.id || 'N/A'}`, 160, 55);
        doc.text(new Date(invoice.issueDate || Date.now()).toLocaleDateString(), 160, 60);
        doc.text(invoice.status || 'PENDING', 160, 65);

        // 3. Table of Items
        const tableData = (invoice.items || []).map((item, index) => [
            index + 1,
            item.itemName || 'Product',
            item.quantity,
            `INR ${item.unitPrice.toFixed(2)}`,
            `INR ${(item.quantity * item.unitPrice).toFixed(2)}`
        ]);

        doc.autoTable({
            startY: 80,
            head: [['#', 'Description', 'Qty', 'Unit Price', 'Total']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: blue, textColor: 255 },
            styles: { fontSize: 9, cellPadding: 5 },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 'auto' },
                2: { halign: 'center', cellWidth: 20 },
                3: { halign: 'right', cellWidth: 30 },
                4: { halign: 'right', cellWidth: 30 }
            }
        });

        // 4. Totals
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('GRAND TOTAL:', 130, finalY);
        doc.text(`INR ${invoice.totalAmount.toFixed(2)}`, 190, finalY, { align: 'right' });

        // 5. Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text('Thank you for choosing BizFlow. This is a computer generated document.', 105, 285, { align: 'center' });

        doc.save(`Invoice_${invoice.id || 'New'}.pdf`);
    }
};

export default pdfExportService;
