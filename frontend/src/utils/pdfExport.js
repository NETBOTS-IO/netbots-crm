import { jsPDF } from 'jspdf';

/**
 * Reusable helper to export data tables to PDF with company branding and clean alignments.
 * @param {string} title Report Title
 * @param {string[]} headers Column headers
 * @param {any[][]} rows Table rows
 * @param {string} filename Output file name
 */
export const exportTableToPDF = (title, headers, rows, filename) => {
    try {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // 1. Add Header Branding
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text("Net Bots  (SMC-PRIVATE) LIMITED", 14, 15);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text("Intellectual property of Net Bots  (SMC-PRIVATE) LIMITED", 14, 19);

        // Try adding the logo if served publicly
        try {
            doc.addImage('/logo.png', 'PNG', 240, 6, 42, 14);
        } catch (imgErr) {
            console.warn("Logo failed to load in PDF export, proceeding with text only.", imgErr);
        }

        doc.setDrawColor(226, 232, 240); // slate-200
        doc.line(14, 23, 282, 23);

        // 2. Report Metadata
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(title, 14, 30);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Exported On: ${new Date().toLocaleString()} | Total Records: ${rows.length}`, 14, 34);

        doc.line(14, 37, 282, 37);

        // 3. Draw Table Headers
        let y = 43;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);

        const finalHeaders = ["S.No", ...headers];
        const finalRows = rows.map((row, idx) => [String(idx + 1), ...row]);

        // Calculate dynamic column widths
        const pageWidth = 268; // 282 - 14
        const colWidth = pageWidth / finalHeaders.length;

        finalHeaders.forEach((header, index) => {
            doc.text(header, 14 + (index * colWidth), y);
        });

        doc.setDrawColor(148, 163, 184); // slate-400
        doc.line(14, y + 2, 282, y + 2);
        y += 8;

        // 4. Draw Rows
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85); // slate-700

        finalRows.forEach((row) => {
            // Check page overflow
            if (y > 185) {
                doc.addPage();
                // Redraw headers on new page
                y = 20;
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                finalHeaders.forEach((header, index) => {
                    doc.text(header, 14 + (index * colWidth), y);
                });
                doc.line(14, y + 2, 282, y + 2);
                y += 8;
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
            }

            row.forEach((cell, cellIndex) => {
                const cellText = String(cell || '');
                const truncatedText = cellText.length > 32 ? cellText.substring(0, 30) + '...' : cellText;
                doc.text(truncatedText, 14 + (cellIndex * colWidth), y);
            });

            y += 6;
        });

        doc.save(filename);
    } catch (err) {
        console.error("PDF Export generation failed", err);
    }
};
