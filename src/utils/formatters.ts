// Formatting utilities for Indonesian currency, dates, and numbers

export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  return new Intl.NumberFormat('id-ID').format(amount);
}

export function parseDateSafe(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  if (!str) return null;

  // 1. Plain DD-MM-YYYY or DD/MM/YYYY (e.g. 15-01-2026 or 15/01/2026)
  const ddmmyyyyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
    const year = parseInt(ddmmyyyyMatch[3], 10);
    return new Date(year, month, day);
  }

  // 2. Plain YYYY-MM-DD or YYYY/MM/DD (e.g. 2026-01-15 or 2026/01/15)
  const yyyymmddMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (yyyymmddMatch) {
    const year = parseInt(yyyymmddMatch[1], 10);
    const month = parseInt(yyyymmddMatch[2], 10) - 1;
    const day = parseInt(yyyymmddMatch[3], 10);
    return new Date(year, month, day);
  }

  // 3. ISO timestamp string with 'T' (e.g. 2026-01-14T17:00:00.000Z or 2026-01-15T00:00:00.000Z)
  if (str.includes('T')) {
    if (str.endsWith('T00:00:00.000Z') || str.endsWith('T00:00:00Z')) {
      const datePart = str.split('T')[0];
      const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
      }
    }
    const dt = new Date(str);
    if (!isNaN(dt.getTime())) {
      return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    }
  }

  // Fallback
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  return null;
}

export function formatDateDDMMYYYY(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (!str) return '';

  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    return str;
  }

  const d = parseDateSafe(str);
  if (!d) return str;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function normalizeDateString(dateStr: any): string {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (!str) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  return formatDateInput(str);
}

export function formatDateIndo(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const date = parseDateSafe(dateStr);
    if (!date) return String(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return String(dateStr);
  }
}

export function formatDateInput(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (!str) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  const d = parseDateSafe(str);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateTaxEstimates(realisasi: number) {
  if (!realisasi || realisasi <= 0) {
    return { ppn: 0, pph21: 0, pph22: 0, pph23: 0, pphPasal4: 0 };
  }
  // Standard estimates:
  // PPN 11% = (Realisasi * 11) / 111 (or 11% of DPP)
  const dpp = Math.round(realisasi / 1.11);
  const ppn = Math.round(dpp * 0.11);
  const pph22 = Math.round(dpp * 0.015); // PPh 22 1.5%
  const pph23 = Math.round(dpp * 0.02);  // PPh 23 2%
  
  return {
    ppn,
    pph21: 0,
    pph22,
    pph23: 0,
    pphPasal4: 0,
  };
}

export function getDaysRemaining(endDateStr: string): number {
  if (!endDateStr) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(endDateStr);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getStatusContract(endDateStr: string, persentaseFisik: number) {
  if (persentaseFisik >= 100) {
    return {
      label: 'Selesai 100%',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      badge: 'bg-emerald-500',
      isMendekati: false,
      isSelesai: true
    };
  }
  const days = getDaysRemaining(endDateStr);
  if (days < 0) {
    return {
      label: `Keterlambatan (${Math.abs(days)} hr)`,
      color: 'bg-rose-100 text-rose-800 border-rose-200',
      badge: 'bg-rose-500',
      isMendekati: true,
      isSelesai: false
    };
  }
  if (days <= 30) {
    return {
      label: `Mendekati Deadline (${days} hr)`,
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      badge: 'bg-amber-500',
      isMendekati: true,
      isSelesai: false
    };
  }
  return {
    label: `Dalam Proses (${days} hr lagi)`,
    color: 'bg-sky-100 text-sky-800 border-sky-200',
    badge: 'bg-sky-500',
    isMendekati: false,
    isSelesai: false
  };
}
