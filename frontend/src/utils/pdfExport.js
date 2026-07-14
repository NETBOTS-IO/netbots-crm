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

        // Smart semantic weights for columns to allocate optimal space and prevent overlapping
        const getHeaderWeight = (headerName) => {
            const name = String(headerName).toLowerCase().trim();
            if (name === 's.no') return 3;
            if (name.includes('company') || name.includes('client') || name.includes('name')) return 11;
            if (name.includes('contact person') || name.includes('contact')) return 9;
            if (name.includes('phone') || name.includes('email') || name.includes('details')) return 13;
            if (name.includes('remaining') || name.includes('due') || name.includes('time')) return 7;
            if (name.includes('date') || name.includes('schedule')) return 9;
            if (name.includes('priority')) return 6;
            if (name.includes('temp') || name.includes('temperature')) return 5;
            if (name.includes('closer') || name.includes('assigned')) return 9;
            if (name.includes('action') || name.includes('details')) return 8;
            if (name.includes('amount') || name.includes('value') || name.includes('commission') || name.includes('payout')) return 8;
            if (name.includes('lead')) return 11;
            return 8; // default weight
        };

        const totalWeight = finalHeaders.reduce((sum, h) => sum + getHeaderWeight(h), 0);
        const pageWidth = 268; // 282 - 14

        // Precalculate X coordinates and widths for each column
        let currentX = 14;
        const colLayout = finalHeaders.map((header) => {
            const width = (getHeaderWeight(header) / totalWeight) * pageWidth;
            const x = currentX;
            currentX += width;
            return { x, width };
        });

        // 3. Draw Table Headers
        y = 43;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);

        finalHeaders.forEach((header, index) => {
            doc.text(header, colLayout[index].x, y);
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
                    doc.text(header, colLayout[index].x, y);
                });
                doc.line(14, y + 2, 282, y + 2);
                y += 8;
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
            }

            row.forEach((cell, cellIndex) => {
                const cellText = String(cell || '');
                const layout = colLayout[cellIndex];
                // Safe char limit calculation based on column width
                const maxChars = Math.floor(layout.width * 0.72);
                const truncatedText = cellText.length > maxChars ? cellText.substring(0, maxChars - 3) + '...' : cellText;
                doc.text(truncatedText, layout.x, y);
            });

            y += 6;
        });

        doc.save(filename);
    } catch (err) {
        console.error("PDF Export generation failed", err);
    }
};
