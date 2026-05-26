const PDFDocument = require('pdfkit');
const Payment = require('../models/Payment');
const Flat = require('../models/Flat');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Helper: build filter from request ─────────────────────────────────────────
const buildFilter = (req) => {
  const { wing, year, month } = req.query;
  const currentYear = parseInt(year) || new Date().getFullYear();
  const filter = { isDeleted: false, year: currentYear };
  if (req.user.role === 'wing_admin') {
    filter.wing = req.user.wing;
  } else if (wing) {
    filter.wing = wing;
  }
  if (month) filter.month = parseInt(month);
  return { filter, currentYear, wing: filter.wing, month };
};

// ── PDF Export ────────────────────────────────────────────────────────────────
exports.exportPDF = async (req, res) => {
  try {
    const { filter, currentYear, wing, month } = buildFilter(req);
    const payments = await Payment.find(filter).sort({ wing: 1, flatNumber: 1, month: 1 });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="society-report-${currentYear}.pdf"`);
    doc.pipe(res);

    // ── Title ──
    doc.fontSize(18).fillColor('#1e40af')
      .text('Society Maintenance Report', { align: 'center' });
    doc.fontSize(11).fillColor('#6b7280')
      .text(`Year: ${currentYear}${wing ? `  |  Wing: ${wing}` : ''}${month ? `  |  Month: ${MONTHS[parseInt(month)-1]}` : ''}`,
        { align: 'center' });
    doc.moveDown(0.5);

    // ── Summary bar ──
    const paidCount       = payments.filter(p => p.status === 'paid').length;
    const unpaidCount     = payments.filter(p => p.status !== 'paid').length;
    const totalCollected  = payments.filter(p => p.status === 'paid')
                                    .reduce((s, p) => s + (p.amount || 0), 0);

    doc.fontSize(10).fillColor('#111827');
    doc.text(
      `Total Records: ${payments.length}   Paid: ${paidCount}   ` +
      `Unpaid/Overdue: ${unpaidCount}   ` +
      `Total Collected: Rs. ${totalCollected.toLocaleString('en-IN')}`
    );
    doc.moveDown(0.8);

    // ── Table ──
    const cols    = [60, 40, 50, 60, 70, 80, 120];
    const headers = ['Flat No', 'Wing', 'Month', 'Status', 'Amount', 'Paid On', 'Remarks'];
    const tableW  = cols.reduce((a, b) => a + b, 0);

    // Header row
    let y = doc.y;
    doc.rect(40, y, tableW, 20).fill('#1e40af');
    doc.fillColor('white').fontSize(8.5);
    let x = 40;
    headers.forEach((h, i) => {
      doc.text(h, x + 3, y + 5, { width: cols[i] - 4 });
      x += cols[i];
    });
    y += 21;

    // Data rows
    payments.forEach((p, idx) => {
      if (y > 770) {
        doc.addPage();
        y = 40;
        // Re-draw header on new page
        doc.rect(40, y, tableW, 20).fill('#1e40af');
        doc.fillColor('white').fontSize(8.5);
        let hx = 40;
        headers.forEach((h, i) => {
          doc.text(h, hx + 3, y + 5, { width: cols[i] - 4 });
          hx += cols[i];
        });
        y += 21;
      }

      const bg = idx % 2 === 0 ? '#f9fafb' : '#ffffff';
      doc.rect(40, y, tableW, 18).fill(bg);

      const statusColor =
        p.status === 'paid'    ? '#065f46' :
        p.status === 'overdue' ? '#92400e' : '#991b1b';
      doc.fillColor(statusColor).fontSize(8);

      const row = [
        p.flatNumber,
        p.wing,
        MONTHS[p.month - 1],
        p.status.toUpperCase(),
        // Use Rs. instead of ₹ to avoid PDFKit font issues
        p.amount ? `Rs. ${p.amount}` : '-',
        p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '-',
        p.remarks || '-'
      ];

      x = 40;
      row.forEach((val, i) => {
        doc.text(String(val), x + 3, y + 4, { width: cols[i] - 4, ellipsis: true });
        x += cols[i];
      });
      y += 19;
    });

    doc.moveDown(2);
    doc.fontSize(8).fillColor('#9ca3af')
      .text(`Generated: ${new Date().toLocaleString('en-IN')}`, { align: 'right' });

    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// ── Excel / CSV Export ────────────────────────────────────────────────────────
exports.exportCSV = async (req, res) => {
  try {
    const { filter, currentYear, wing, month } = buildFilter(req);
    const payments = await Payment.find(filter).sort({ wing: 1, flatNumber: 1, month: 1 });

    const HEADERS = [
      'Flat Number', 'Wing', 'Month', 'Year',
      'Status', 'Amount (Rs.)', 'Payment Date', 'Payment Mode', 'Remarks'
    ];

    const escape = (val) => {
      const s = String(val === undefined || val === null ? '' : val);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const rows = payments.map(p => [
      p.flatNumber,
      p.wing,
      MONTHS[p.month - 1],
      p.year,
      p.status,
      p.amount || 0,
      p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '',
      p.paymentMode || '',
      p.remarks || ''
    ].map(escape).join(','));

    const csv = [HEADERS.join(','), ...rows].join('\r\n');

    const filename = `maintenance-report${wing ? `-Wing${wing}` : ''}-${currentYear}${month ? `-${MONTHS[month-1]}` : ''}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    // BOM so Excel opens UTF-8 correctly
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
