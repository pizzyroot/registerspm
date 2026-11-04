import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah, formatDateIndo } from './formatters';

export function exportTableToExcel(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  // Create worksheet
  const wsData = [
    [title.toUpperCase()],
    [`Tanggal Cetak: ${formatDateIndo(new Date().toISOString())}`],
    [], // Blank row
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set header styling / column widths
  const colWidths = headers.map((h, colIndex) => {
    let maxLen = h.length;
    rows.forEach((row) => {
      const val = row[colIndex] !== undefined ? String(row[colIndex]) : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    return { wch: Math.min(Math.max(maxLen + 3, 12), 50) };
  });

  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan');

  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportTableToPdf(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string,
  orientation: 'p' | 'l' = 'l' // default landscape for wide accounting tables
) {
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4',
  });

  // Header Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), doc.internal.pageSize.getWidth() / 2, 15, {
    align: 'center',
  });

  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, 21, {
      align: 'center',
    });
  }

  doc.setFontSize(8);
  doc.text(
    `Dicetak pada: ${formatDateIndo(new Date().toISOString())}`,
    14,
    27
  );

  autoTable(doc, {
    startY: 30,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 30, 30],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 30, right: 14, bottom: 15, left: 14 },
    styles: {
      overflow: 'linebreak',
      cellPadding: 2,
    },
  });

  // Footer page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      doc.internal.pageSize.getWidth() - 25,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export interface RekapBidangItemRow {
  level: 'bidang' | 'program' | 'kegiatan' | 'sub' | 'rekening' | 'total';
  kode: string;
  nama: string;
  pagu: number;
  realisasi: number;
  persentase: number;
  sisa: number;
}

export interface RekapBidangPdfConfig {
  tahun: string;
  filterBidang: string;
  filterPeriode: string;
  filterJenisBelanja: string;
  sembunyikanRekening: boolean;
  grandPagu: number;
  grandRealisasi: number;
  grandSisa: number;
  grandPersentase: number;
  filename: string;
}

export function exportRekapBidangHierarchyToPdf(
  items: RekapBidangItemRow[],
  config: RekapBidangPdfConfig
) {
  const doc = new jsPDF({
    orientation: 'l', // Landscape A4
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~297 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // ~210 mm

  // Header Title (Register SPM Style)
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(
    `REKAPITULASI BELANJA PER BIDANG TAHUN ANGGARAN ${config.tahun}`.toUpperCase(),
    pageWidth / 2,
    14,
    { align: 'center' }
  );

  // Subtitle
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85); // Slate 700
  doc.text(
    'Pemerintah Daerah - Laporan Rekapitulasi Struktur Hirarki Pagu & Realisasi SPM',
    pageWidth / 2,
    19,
    { align: 'center' }
  );

  // Date Printed & Filter Info (Top Left & Right)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Dicetak pada: ${formatDateIndo(new Date().toISOString())}`, 14, 25);
  doc.text(
    `Filter: ${config.filterBidang} | Periode: ${config.filterPeriode}`,
    pageWidth - 14,
    25,
    { align: 'right' }
  );

  // Table Setup (Register SPM Style)
  const headers = [
    'KODE',
    'URAIAN HIRARKI BELANJA',
    'PAGU ANGGARAN (RP)',
    'REALISASI SPM (RP)',
    '%',
    'SISA ANGGARAN (RP)',
  ];

  const bodyRows = items.map((item) => {
    let prefix = '';
    if (item.level === 'bidang') prefix = 'BIDANG: ';
    else if (item.level === 'program') prefix = '   Prog: ';
    else if (item.level === 'kegiatan') prefix = '      Keg: ';
    else if (item.level === 'sub') prefix = '         Sub: ';
    else if (item.level === 'rekening') prefix = '            - ';
    else if (item.level === 'total') prefix = '';

    const row = [
      item.kode,
      `${prefix}${item.nama}`,
      formatRupiah(item.pagu),
      formatRupiah(item.realisasi),
      `${item.persentase.toFixed(1)}%`,
      formatRupiah(item.sisa),
    ];

    (row as any)._level = item.level;
    (row as any)._persentase = item.persentase;
    return row;
  });

  autoTable(doc, {
    startY: 28,
    head: [headers],
    body: bodyRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800 (Identical to Register SPM)
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 2.2,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42], // Clear dark text, eye-friendly high contrast
    },
    columnStyles: {
      0: { cellWidth: 26, halign: 'left' },
      1: { cellWidth: 110, halign: 'left' },
      2: { cellWidth: 36, halign: 'right' },
      3: { cellWidth: 36, halign: 'right' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 41, halign: 'right' },
    },
    styles: {
      cellPadding: 2,
      overflow: 'linebreak',
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const level = (data.row.raw as any)?._level;

        if (level === 'bidang') {
          data.cell.styles.fillColor = [224, 238, 248]; // Soft eye-friendly blue tint
          data.cell.styles.textColor = [15, 23, 42];    // Slate 900 (High contrast dark text, no eye strain)
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 8;
        } else if (level === 'program') {
          data.cell.styles.fillColor = [241, 245, 249]; // Soft Slate 100
          data.cell.styles.textColor = [15, 23, 42];    // Slate 900
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 7.5;
        } else if (level === 'kegiatan') {
          data.cell.styles.fillColor = [255, 255, 255];
          data.cell.styles.textColor = [30, 41, 59];    // Slate 800
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 7;
        } else if (level === 'sub') {
          data.cell.styles.fillColor = [255, 255, 255];
          data.cell.styles.textColor = [51, 65, 85];    // Slate 700
          data.cell.styles.fontStyle = 'normal';
          data.cell.styles.fontSize = 7;
        } else if (level === 'rekening') {
          data.cell.styles.fillColor = [248, 250, 252]; // Soft Slate 50
          data.cell.styles.textColor = [71, 85, 105];   // Slate 600
          data.cell.styles.fontStyle = 'italic';
          data.cell.styles.fontSize = 6.5;
        } else if (level === 'total') {
          data.cell.styles.fillColor = [30, 41, 59];    // Slate 800
          data.cell.styles.textColor = [255, 255, 255];  // White
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 8.5;
        }
      }
    },
    margin: { top: 28, right: 14, bottom: 15, left: 14 },
  });

  // Footer page numbers (Register SPM Style)
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      pageWidth - 25,
      pageHeight - 8
    );
  }

  doc.save(`${config.filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
}


