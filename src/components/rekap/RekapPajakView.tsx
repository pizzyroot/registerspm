import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { exportTableToExcel, exportTableToPdf } from '../../utils/exporters';
import { FileSpreadsheet, FileText, Filter, Calendar, Receipt } from 'lucide-react';

export const RekapPajakView: React.FC = () => {
  const { selectedYear, spmList } = useApp();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtered SPM list
  const filteredSpm = useMemo(() => {
    return spmList
      .filter((s) => s.tahun === selectedYear)
      .filter((s) => {
        if (startDate && new Date(s.tanggalSpm) < new Date(startDate)) return false;
        if (endDate && new Date(s.tanggalSpm) > new Date(endDate)) return false;
        return true;
      });
  }, [spmList, selectedYear, startDate, endDate]);

  // Tax Sums
  const taxSums = useMemo(() => {
    let totalRealisasi = 0;
    let totalPpn = 0;
    let totalPph21 = 0;
    let totalPph22 = 0;
    let totalPph23 = 0;
    let totalPphPasal4 = 0;

    filteredSpm.forEach((s) => {
      totalRealisasi += s.realisasiSpm || 0;
      if (s.pajak) {
        totalPpn += s.pajak.ppn || 0;
        totalPph21 += s.pajak.pph21 || 0;
        totalPph22 += s.pajak.pph22 || 0;
        totalPph23 += s.pajak.pph23 || 0;
        totalPphPasal4 += s.pajak.pphPasal4 || 0;
      }
    });

    const grandTotalPajak = totalPpn + totalPph21 + totalPph22 + totalPph23 + totalPphPasal4;

    return {
      totalRealisasi,
      totalPpn,
      totalPph21,
      totalPph22,
      totalPph23,
      totalPphPasal4,
      grandTotalPajak,
    };
  }, [filteredSpm]);

  // Export Excel
  const handleExportExcel = () => {
    const headers = [
      'No',
      'Nomor SPM',
      'Tgl SPM',
      'Uraian SPM',
      'Realisasi (Rp)',
      'PPN (11%) (Rp)',
      'PPh 21 (Rp)',
      'PPh 22 (Rp)',
      'PPh 23 (Rp)',
      'PPh Pasal 4(2) (Rp)',
      'Total Potongan Pajak (Rp)',
    ];

    const rows = filteredSpm.map((s, idx) => {
      const p = s.pajak || { ppn: 0, pph21: 0, pph22: 0, pph23: 0, pphPasal4: 0 };
      const rowTaxSum =
        (p.ppn || 0) + (p.pph21 || 0) + (p.pph22 || 0) + (p.pph23 || 0) + (p.pphPasal4 || 0);

      return [
        idx + 1,
        s.nomorSpm,
        formatDateIndo(s.tanggalSpm),
        s.uraianPekerjaan,
        s.realisasiSpm,
        p.ppn || 0,
        p.pph21 || 0,
        p.pph22 || 0,
        p.pph23 || 0,
        p.pphPasal4 || 0,
        rowTaxSum,
      ];
    });

    rows.push([]);
    rows.push([
      'TOTAL',
      'JUMLAH TOTAL',
      '',
      'JUMLAH REKAPITULASI PAJAK',
      taxSums.totalRealisasi,
      taxSums.totalPpn,
      taxSums.totalPph21,
      taxSums.totalPph22,
      taxSums.totalPph23,
      taxSums.totalPphPasal4,
      taxSums.grandTotalPajak,
    ]);

    exportTableToExcel(
      `REKAPITULASI PAJAK SPM TAHUN ANGGARAN ${selectedYear}`,
      headers,
      rows,
      `Rekap_Laporan_Pajak_${selectedYear}`
    );
  };

  // Export PDF
  const handleExportPdf = () => {
    const headers = [
      'NO',
      'NOMOR & TGL SPM',
      'URAIAN SPM',
      'REALISASI',
      'PPN (11%)',
      'PPh 21',
      'PPh 22',
      'PPh 23',
      'PPh PASAL 4',
    ];

    const rows = filteredSpm.map((s, idx) => {
      const p = s.pajak || { ppn: 0, pph21: 0, pph22: 0, pph23: 0, pphPasal4: 0 };
      return [
        idx + 1,
        `${s.nomorSpm}\n${formatDateIndo(s.tanggalSpm)}`,
        s.uraianPekerjaan,
        formatRupiah(s.realisasiSpm),
        formatRupiah(p.ppn),
        formatRupiah(p.pph21),
        formatRupiah(p.pph22),
        formatRupiah(p.pph23),
        formatRupiah(p.pphPasal4),
      ];
    });

    exportTableToPdf(
      `REKAPITULASI LAPORAN PAJAK SPM (TA ${selectedYear})`,
      'Pemerintah Daerah - Setoran Pemotongan Pajak Kas Negara',
      headers,
      rows,
      `Rekap_Laporan_Pajak_${selectedYear}`,
      'l'
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-600" />
            Rekapitulasi Laporan Pajak SPM
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar rincian pemotongan pajak (PPN, PPh 21, PPh 22, PPh 23, PPh Pasal 4) dari pencairan SPM.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs rounded-2xl transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs rounded-2xl transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Box */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          Filter Periode Laporan Pajak
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Dari Tanggal SPM
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Sampai Tanggal SPM
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Main Table Output */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between text-xs font-bold">
          <span>TAMPILAN HASIL REKAP LAPORAN PAJAK ({filteredSpm.length} SPM)</span>
          <span className="text-[11px] text-sky-300">Tahun Anggaran {selectedYear}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse table-auto">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200 text-[10px] tracking-tight">
                <th className="px-2 py-2 text-center w-8">NO</th>
                <th className="px-2 py-2 min-w-[110px]">NOMOR & TGL SPM</th>
                <th className="px-2 py-2 min-w-[160px]">URAIAN SPM</th>
                <th className="px-2 py-2 text-right min-w-[100px]">REALISASI</th>
                <th className="px-2 py-2 text-right min-w-[85px]">PPN (11%)</th>
                <th className="px-2 py-2 text-right min-w-[75px]">PPh 21</th>
                <th className="px-2 py-2 text-right min-w-[75px]">PPh 22</th>
                <th className="px-2 py-2 text-right min-w-[75px]">PPh 23</th>
                <th className="px-2 py-2 text-right min-w-[85px]">PPh PASAL 4</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {filteredSpm.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                    Tidak ada data pencairan SPM dengan potongan pajak di periode ini.
                  </td>
                </tr>
              ) : (
                filteredSpm.map((spm, idx) => {
                  const p = spm.pajak || { ppn: 0, pph21: 0, pph22: 0, pph23: 0, pphPasal4: 0 };
                  return (
                    <tr key={spm.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-2 py-2 text-center font-bold text-slate-500 text-[11px] align-top">{idx + 1}</td>
                      <td className="px-2 py-2 align-top">
                        <div className="font-bold font-mono text-slate-900 text-[10px] leading-tight break-all">{spm.nomorSpm}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5 whitespace-nowrap">{formatDateIndo(spm.tanggalSpm)}</div>
                      </td>
                      <td className="px-2 py-2 align-top font-medium text-slate-800 text-[11px] leading-tight break-words">{spm.uraianPekerjaan}</td>
                      <td className="px-2 py-2 align-top text-right font-bold text-sky-800 text-[11px]">
                        {formatRupiah(spm.realisasiSpm)}
                      </td>
                      <td className="px-2 py-2 align-top text-right font-semibold text-indigo-900 text-[11px]">
                        {p.ppn ? formatRupiah(p.ppn) : '-'}
                      </td>
                      <td className="px-2 py-2 align-top text-right font-semibold text-indigo-900 text-[11px]">
                        {p.pph21 ? formatRupiah(p.pph21) : '-'}
                      </td>
                      <td className="px-2 py-2 align-top text-right font-semibold text-indigo-900 text-[11px]">
                        {p.pph22 ? formatRupiah(p.pph22) : '-'}
                      </td>
                      <td className="px-2 py-2 align-top text-right font-semibold text-indigo-900 text-[11px]">
                        {p.pph23 ? formatRupiah(p.pph23) : '-'}
                      </td>
                      <td className="px-2 py-2 align-top text-right font-semibold text-indigo-900 text-[11px]">
                        {p.pphPasal4 ? formatRupiah(p.pphPasal4) : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Bottom Total Rows per Tax Type */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-extrabold text-[11px]">
                <td className="px-2 py-2.5 text-center" colSpan={3}>
                  JUMLAH TOTAL PER PAJAK
                </td>
                <td className="px-2 py-2.5 text-right text-sky-300 font-black">
                  {formatRupiah(taxSums.totalRealisasi)}
                </td>
                <td className="px-2 py-2.5 text-right text-indigo-200">{formatRupiah(taxSums.totalPpn)}</td>
                <td className="px-2 py-2.5 text-right text-indigo-200">{formatRupiah(taxSums.totalPph21)}</td>
                <td className="px-2 py-2.5 text-right text-indigo-200">{formatRupiah(taxSums.totalPph22)}</td>
                <td className="px-2 py-2.5 text-right text-indigo-200">{formatRupiah(taxSums.totalPph23)}</td>
                <td className="px-2 py-2.5 text-right text-indigo-200">{formatRupiah(taxSums.totalPphPasal4)}</td>
              </tr>
              <tr className="bg-indigo-950 text-sky-300 font-extrabold text-[11px] border-t border-indigo-800">
                <td className="px-2 py-2.5 text-center" colSpan={3}>
                  GRAND TOTAL ENTIRE TAX SETORAN KAS NEGARA
                </td>
                <td className="px-2 py-2.5 text-right" colSpan={6}>
                  <span className="text-xs font-extrabold text-white">
                    {formatRupiah(taxSums.grandTotalPajak)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
