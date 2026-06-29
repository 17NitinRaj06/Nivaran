import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateComplaintReport(report) {
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.text('Nivaran', 14, 22);
  doc.setFontSize(10);
  doc.text('Civic Grievance Platform', 14, 29);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 35);

  doc.setDrawColor(45, 110, 52);
  doc.setLineWidth(0.5);
  doc.line(14, 39, 196, 39);

  let y = 48;
  const addField = (label, value) => {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(label, 14, y);
    doc.setTextColor(50);
    doc.setFontSize(11);
    doc.text(String(value || 'N/A'), 14, y + 5);
    y += 14;
  };

  addField('Complaint ID:', report.id);
  addField('Status:', report.status?.charAt(0).toUpperCase() + report.status?.slice(1));
  addField('Category:', report.category?.charAt(0).toUpperCase() + report.category?.slice(1));
  addField('Description:', report.description);
  addField('Location:', [report.area, report.city, report.state].filter(Boolean).join(', ') || 'Not specified');
  addField('Pincode:', report.pincode || 'N/A');
  addField('Reporter:', report.userName || 'Anonymous');
  addField('Date Reported:', report.createdAt ? new Date(report.createdAt?.seconds * 1000 || report.createdAt).toLocaleDateString('en-IN') : 'N/A');
  addField('Upvotes:', report.upvotes || 0);

  if (report.statusHistory && report.statusHistory.length > 0) {
    y += 5;
    doc.setFontSize(14);
    doc.setTextColor(45, 110, 52);
    doc.text('Status History', 14, y);
    y += 8;

    const historyData = report.statusHistory.map(h => [
      h.status?.charAt(0).toUpperCase() + h.status?.slice(1).replace('-', ' '),
      h.timestamp ? new Date(h.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A',
      h.note || '',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Status', 'Date', 'Note']],
      body: historyData,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [45, 110, 52], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 249, 242] },
    });
  }

  if (report.imageURL) {
    y = doc.lastAutoTable?.finalY || y;
    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(45, 110, 52);
    doc.text('Attachment', 14, y);
  }

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('This is a system-generated report from Nivaran Civic Platform.', 14, 280);
  doc.text(`Report ID: ${report.id}`, 14, 285);

  doc.save(`nivaran-complaint-${report.id?.slice(0, 8) || Date.now()}.pdf`);
}

export function generateBulkReport(reports, stats) {
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.text('Nivaran - Bulk Complaint Report', 14, 22);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 29);
  doc.text(`Total Reports: ${stats?.total || reports.length}`, 14, 35);

  doc.setDrawColor(45, 110, 52);
  doc.setLineWidth(0.5);
  doc.line(14, 39, 196, 39);

  const tableData = reports.map(r => [
    r.id?.slice(0, 8) || 'N/A',
    r.category || 'N/A',
    r.status || 'N/A',
    r.area || 'N/A',
    r.city || 'N/A',
    r.userName || 'Anonymous',
    r.createdAt ? new Date(r.createdAt?.seconds * 1000 || r.createdAt).toLocaleDateString() : 'N/A',
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['ID', 'Category', 'Status', 'Area', 'City', 'Reporter', 'Date']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [45, 110, 52], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 249, 242] },
  });

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('System-generated report from Nivaran Civic Platform.', 14, 280);

  doc.save(`nivaran-bulk-report-${Date.now()}.pdf`);
}
