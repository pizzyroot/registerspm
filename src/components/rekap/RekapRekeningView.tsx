import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/formatters';
import { exportTableToExcel, exportTableToPdf } from '../../utils/exporters';
import { Receipt, FileSpreadsheet, FileText, Filter, Calendar } from 'lucide-react';

export const RekapRekeningView: React.FC = () => {
  const { selectedYear, rekeningList, spmList, jurnalBelanjaList, pengembalianBelanjaList } = useApp();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [jenisBelanja, setJenisBelanja] = useState<string>('all');

  // Filter SPM by date range & jenis belanja
  const filteredSpm = useMemo(() => {
    return spmList
      .filter((s) => s.tahun === selectedYear)
      .filter((s) => {
        if (startDate && new Date(s.tanggalSpm) < new Date(startDate)) return false;
        if (endDate && new Date(s.tanggalSpm) > new Date(endDate)) return false;
        if (jenisBelanja !== 'all' && s.jenisBelanja !== jenisBelanja) return false;
        return true;
      });
  }, [spmList, selectedYear, startDate, endDate, jenisBelanja]);

  // Filter Jurnal Belanja by date range
  const filteredJurnal = useMemo(() => {
    return jurnalBelanjaList
      .filter((j) => j.tahun === selectedYear)
      .filter((j) => {
        if (startDate && new Date(j.tanggal) < new Date(startDate)) return false;
        if (endDate && new Date(j.tanggal) > new Date(endDate)) return false;
        return true;
      });
  }, [jurnalBelanjaList, selectedYear, startDate, endDate]);

  // Filter Pengembalian Belanja (STS) by date range
  const filteredPengembalian = useMemo(() => {
    return pengembalianBelanjaList
      .filter((p) => p.tahun === selectedYear)
      .filter((p) => {
        if (startDate && new Date(p.tanggal) < new Date(startDate)) return false;
        if (endDate && new Date(p.tanggal) > new Date(endDate)) return false;
        return true;
      });
  }, [pengembalianBelanjaList, selectedYear, startDate, endDate]);

  // Aggregate realisasi per rekening
  const rekapRekeningData = useMemo(() => {
    const activeRekening = rekeningList.filter((r) => r.tahun === selectedYear);

    let grandPagu = 0;
    let grandRealisasi = 0;

    const rows = activeRekening.map((rek) => {
      let realisasi = 0;
      filteredSpm.forEach((s) => {
        s.rincianBelanja.forEach((rc) => {
          if (rc.rekeningId === rek.id) {
            realisasi += rc.nilaiRealisasi || 0;
          }
        });
      });

      filteredPengembalian.forEach((p) => {
        p.rincianPengembalian.forEach((rp) => {
          if (rp.rekeningId === rek.id) {
            realisasi -= rp.nominal || 0;
          }
        });
      });

      filteredJurnal.forEach((j) => {
        if (j.rincianAsal && j.rincianAsal.length > 0) {
          j.rincianAsal.forEach((ra) => {
            if (ra.rekeningId === rek.id) {
              realisasi -= ra.jumlah || 0;
            }
          });
        } else if (j.rekeningAsalId === rek.id) {
          realisasi -= j.jumlah || 0;
        }

        if (j.rincianTujuan && j.rincianTujuan.length > 0) {
          j.rincianTujuan.forEach((rt) => {
            if (rt.rekeningId === rek.id) {
              realisasi += rt.jumlah || 0;
            }
          });
        } else if (j.rekeningTujuanId === rek.id) {
          realisasi += j.jumlah || 0;
        }
      });

      const sisa = rek.pagu - realisasi;
      const persentase = rek.pagu > 0 ? (realisasi / rek.pagu) * 100 : 0;

      grandPagu += rek.pagu;
      grandRealisasi += realisasi;

      return {
        rek,
        pagu: rek.pagu,
        realisasi,
        sisa,
        persentase,
      };
    });

    return {
      rows,
      grandPagu,
      grandRealisasi,
      grandSisa: grandPagu - grandRealisasi,
      grandPersentase: grandPagu > 0 ? (grandRealisasi / grandPagu) * 100 : 0,
    };
  }, [rekeningList, filteredSpm, filteredJurnal, filteredPengembalian, selectedYear]);

  // Export Excel
  const handleExportExcel = () => {
    const headers = [
      'No',
      'Kode Rekening',
      'Nama Rekening Belanja',
      'Pagu Anggaran (Rp)',
      'Realisasi (Rp)',
      'Sisa Anggaran (Rp)',
      'Persentase (%)',
    ];

    const rows = rekapRekeningData.rows.map((row, idx) => [
      idx + 1,
      row.rek.kode,
      row.rek.nama,
      row.pagu,
      row.realisasi,
      row.sisa,
      `${row.persentase.toFixed(2)}%`,
    ]);

    rows.push([]);
    rows.push([
      'TOTAL',
      'TOTAL',
      'TOTAL SELURUH REKENING BELANJA',
      rekapRekeningData.grandPagu,
      rekapRekeningData.grandRealisasi,
      rekapRekeningData.grandSisa,
      `${rekapRekeningData.grandPersentase.toFixed(2)}%`,
    ]);

    exportTableToExcel(
      `REKAPITULASI REKENING BELANJA TAHUN ANGGARAN ${selectedYear}`,
      headers,
      rows,
      `Rekap_Rekening_Belanja_${selectedYear}`
    );
  };

  // Export PDF
  const handleExportPdf = () => {
    const headers = [
      'NO',
      'KODE REKENING',
      'NAMA REKENING BELANJA',
      'PAGU',
      'REALISASI',
      'SISA',
      'PERSEN %',
    ];

    const rows = rekapRekeningData.rows.map((row, idx) => [
      idx + 1,
      row.rek.kode,
      row.rek.nama,
      formatRupiah(row.pagu),
      formatRupiah(row.realisasi),
      formatRupiah(row.sisa),
      `${row.persentase.toFixed(1)}%`,
    ]);

    exportTableToPdf(
      `REKAPITULASI REKENING BELANJA (TA ${selectedYear})`,
      'Pemerintah Daerah - Rincian Objek Belanja',
      headers,
      rows,
      `Rekap_Rekening_Belanja_${selectedYear}`,
      'l'
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-sky-600" />
            Rekapitulasi Rekening Belanja
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar seluruh kode rekening objek belanja, pagu anggaran, serta total realisasinya.
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

      {/* Date & Jenis Belanja Filter Box */}
      <div className="bg-white p-5 rounded-3xl border-2 border-slate-900 shadow-sm space-y-3">
        <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 font-heading">
          <Filter className="w-4 h-4 text-amber-500" />
          Filter Periode & Jenis Belanja SPM
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-600 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Dari Tanggal SPM
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-600 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Sampai Tanggal SPM
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-600">
              Jenis Belanja
            </label>
            <select
              value={jenisBelanja}
              onChange={(e) => setJenisBelanja(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold cursor-pointer"
            >
              <option value="all">Semua Jenis Belanja</option>
              <option value="UP">UP (Uang Persediaan)</option>
              <option value="GU">GU (Ganti Uang)</option>
              <option value="TU">TU (Tambah Uang)</option>
              <option value="LS">LS (Langsung)</option>
              <option value="Gaji dan Tunjangan">Gaji dan Tunjangan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Output */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between text-xs font-bold">
          <span>TAMPILAN HASIL REKENING BELANJA ({rekapRekeningData.rows.length} Objek)</span>
          <span className="text-[11px] text-sky-300">Tahun Anggaran {selectedYear}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200 text-[11px]">
                <th className="p-3 text-center w-12">NO</th>
                <th className="p-3 min-w-[150px]">KODE REKENING</th>
                <th className="p-3 min-w-[300px]">NAMA REKENING BELANJA</th>
                <th className="p-3 text-right min-w-[140px]">PAGU</th>
                <th className="p-3 text-right min-w-[140px]">REALISASI</th>
                <th className="p-3 text-right min-w-[140px]">SISA</th>
                <th className="p-3 text-center w-28">PERSENTASE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {rekapRekeningData.rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    Belum ada data rekening belanja diinput untuk tahun ini.
                  </td>
                </tr>
              ) : (
                rekapRekeningData.rows.map((row, idx) => (
                  <tr key={row.rek.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-sky-900">{row.rek.kode}</td>
                    <td className="p-3 font-semibold text-slate-900">{row.rek.nama}</td>
                    <td className="p-3 text-right font-medium text-slate-800">
                      {formatRupiah(row.pagu)}
                    </td>
                    <td className="p-3 text-right font-bold text-sky-800">
                      {formatRupiah(row.realisasi)}
                    </td>
                    <td className="p-3 text-right font-medium text-slate-700">
                      {formatRupiah(row.sisa)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 bg-sky-100 text-sky-800 font-bold rounded-lg text-xs">
                        {row.persentase.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-extrabold text-xs">
                <td className="p-3.5 text-center" colSpan={3}>
                  JUMLAH TOTAL SELURUH REKENING BELANJA
                </td>
                <td className="p-3.5 text-right">{formatRupiah(rekapRekeningData.grandPagu)}</td>
                <td className="p-3.5 text-right text-sky-300">
                  {formatRupiah(rekapRekeningData.grandRealisasi)}
                </td>
                <td className="p-3.5 text-right text-emerald-300">
                  {formatRupiah(rekapRekeningData.grandSisa)}
                </td>
                <td className="p-3.5 text-center">
                  {rekapRekeningData.grandPersentase.toFixed(1)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
