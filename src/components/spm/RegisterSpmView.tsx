import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RegisterSpm, FilterSpm } from '../../types';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { exportTableToExcel, exportTableToPdf } from '../../utils/exporters';
import { SpmFormModal } from './SpmFormModal';
import { SpmDetailModal } from './SpmDetailModal';
import {
  FileCheck2,
  Plus,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Layers,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Receipt,
  X,
} from 'lucide-react';

export const RegisterSpmView: React.FC = () => {
  const {
    selectedYear,
    isAdmin,
    canEdit,
    isLoggedIn,
    spmList,
    bidangList,
    kontrakList,
    rekeningList,
    subKegiatanList,
    deleteSpm,
  } = useApp();

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [spmToEdit, setSpmToEdit] = useState<RegisterSpm | null>(null);
  const [spmDetailView, setSpmDetailView] = useState<RegisterSpm | null>(null);

  // Expanded rows state
  const [expandAll, setExpandAll] = useState<boolean>(false);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleRowExpanded = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filters State - Default limit to 0 to show ALL SPM data at once
  const [filter, setFilter] = useState<FilterSpm>({
    startDate: '',
    endDate: '',
    searchQuery: '',
    bidangId: 'all',
    jenisBelanja: 'all',
    limit: 0,
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset pagination to page 1 whenever filters or year change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, selectedYear]);

  // All Filtered SPM list matching filter criteria - sorted latest first
  const allFilteredSpm = useMemo(() => {
    return spmList
      .map((s, originalIdx) => ({ s, originalIdx }))
      .filter(({ s }) => String(s.tahun) === String(selectedYear))
      .filter(({ s }) => {
        // Date range filter
        if (filter.startDate && new Date(s.tanggalSpm) < new Date(filter.startDate)) return false;
        if (filter.endDate && new Date(s.tanggalSpm) > new Date(filter.endDate)) return false;

        // Search query filter (No SPM / Uraian / Kontrak)
        if (filter.searchQuery.trim()) {
          const q = filter.searchQuery.toLowerCase();
          const k = kontrakList.find((item) => String(item.id) === String(s.kontrakId) || String(item.nomorKontrak) === String(s.kontrakId));
          const matchNoSpm = s.nomorSpm.toLowerCase().includes(q);
          const matchUraian = s.uraianPekerjaan.toLowerCase().includes(q);
          const matchKontrak = k
            ? k.nomorKontrak.toLowerCase().includes(q) || k.uraian.toLowerCase().includes(q)
            : false;
          if (!matchNoSpm && !matchUraian && !matchKontrak) return false;
        }

        // Bidang filter
        if (filter.bidangId !== 'all' && String(s.bidangId) !== String(filter.bidangId)) return false;

        // Jenis Belanja filter
        if (filter.jenisBelanja !== 'all' && s.jenisBelanja !== filter.jenisBelanja) return false;

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.s.tanggalSpm).getTime() || 0;
        const dateB = new Date(b.s.tanggalSpm).getTime() || 0;
        if (dateB !== dateA) {
          return dateB - dateA;
        }
        return b.originalIdx - a.originalIdx;
      })
      .map(({ s }) => s);
  }, [spmList, selectedYear, filter, kontrakList]);

  // Pagination calculations
  const itemsPerPage = filter.limit;
  const totalItems = allFilteredSpm.length;
  const totalPages = itemsPerPage > 0 ? Math.max(1, Math.ceil(totalItems / itemsPerPage)) : 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItemIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endItemIndex = itemsPerPage === 0 ? totalItems : Math.min(safeCurrentPage * itemsPerPage, totalItems);

  // Current paginated SPM items
  const paginatedSpm = useMemo(() => {
    if (itemsPerPage === 0) return allFilteredSpm;
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return allFilteredSpm.slice(start, start + itemsPerPage);
  }, [allFilteredSpm, itemsPerPage, safeCurrentPage]);

  // Helper to calculate smart page numbers
  const getPageNumbers = (current: number, total: number) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // Export Excel
  const handleExportExcel = () => {
    const headers = [
      'No',
      'Nomor SPM',
      'Tgl SPM',
      'Jenis Belanja',
      'Bidang',
      'Uraian Pekerjaan',
      'Detail Kontrak',
      'Fisik %',
      'Realisasi SPM (Rp)',
      'Total Pajak (Rp)',
    ];

    const rows = allFilteredSpm.map((s, idx) => {
      const b = bidangList.find((item) => item.id === s.bidangId);
      const k = kontrakList.find((item) => item.id === s.kontrakId);
      const totalPajak =
        (s.pajak?.ppn || 0) +
        (s.pajak?.pph21 || 0) +
        (s.pajak?.pph22 || 0) +
        (s.pajak?.pph23 || 0) +
        (s.pajak?.pphPasal4 || 0);

      return [
        idx + 1,
        s.nomorSpm,
        formatDateIndo(s.tanggalSpm),
        s.jenisBelanja,
        b?.nama || '-',
        s.uraianPekerjaan,
        k ? `${k.nomorKontrak} (${k.namaPenyedia})` : 'Non-Kontraktual',
        `${s.persentaseFisik}%`,
        s.realisasiSpm,
        totalPajak,
      ];
    });

    exportTableToExcel(
      `REGISTER SPM TAHUN ANGGARAN ${selectedYear}`,
      headers,
      rows,
      `Register_SPM_${selectedYear}`
    );
  };

  // Export PDF
  const handleExportPdf = () => {
    const headers = [
      'NO',
      'NOMOR & TGL SPM',
      'JENIS',
      'BIDANG',
      'URAIAN PEKERJAAN',
      'DETAIL KONTRAK',
      'FISIK %',
      'REALISASI SPM',
      'PAJAK',
    ];

    const rows = allFilteredSpm.map((s, idx) => {
      const b = bidangList.find((item) => item.id === s.bidangId);
      const k = kontrakList.find((item) => item.id === s.kontrakId);
      const totalPajak =
        (s.pajak?.ppn || 0) +
        (s.pajak?.pph21 || 0) +
        (s.pajak?.pph22 || 0) +
        (s.pajak?.pph23 || 0) +
        (s.pajak?.pphPasal4 || 0);

      return [
        idx + 1,
        `${s.nomorSpm}\n${formatDateIndo(s.tanggalSpm)}`,
        s.jenisBelanja,
        b?.nama || '-',
        s.uraianPekerjaan,
        k ? `${k.uraian}\nNo: ${k.nomorKontrak}` : '-',
        `${s.persentaseFisik}%`,
        formatRupiah(s.realisasiSpm),
        formatRupiah(totalPajak),
      ];
    });

    exportTableToPdf(
      `REGISTER SPM TAHUN ANGGARAN ${selectedYear}`,
      'Pemerintah Daerah - Register Pencairan Belanja SPM',
      headers,
      rows,
      `Register_SPM_${selectedYear}`,
      'l'
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5 font-heading">
            <FileCheck2 className="w-6 h-6 text-amber-600" />
            Register Surat Perintah Membayar (SPM)
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Kelola pencairan SPM, rincian objek belanja per bidang, dan potongan pajak daerah.
          </p>
        </div>

        {/* Top Buttons: Input & Export */}
        <div className="flex items-center flex-wrap gap-2.5">
          {canEdit && (
            <button
              onClick={() => {
                setSpmToEdit(null);
                setShowFormModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Input SPM Baru</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200/80"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200/80"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar Box */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-600" />
            <span>Filter Data SPM</span>
          </div>

          <button
            type="button"
            onClick={() => setExpandAll(!expandAll)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            {expandAll ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{expandAll ? 'Sembunyikan Semua Rincian' : 'Tampilkan Semua Rincian'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Periode dd/mm/yyyy */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Dari Tanggal
            </label>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Search No SPM / Uraian / Kontrak */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <label className="text-[11px] font-bold text-slate-600">Pencarian SPM / Kontrak</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={filter.searchQuery}
                onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
                placeholder="No SPM / Uraian / Kontrak..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Per Bidang */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Per Bidang</label>
            <select
              value={filter.bidangId}
              onChange={(e) => setFilter({ ...filter, bidangId: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">Semua Bidang</option>
              {bidangList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Per Jenis Belanja & Limit */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Jenis Belanja & Tampilan</label>
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={filter.jenisBelanja}
                onChange={(e) => setFilter({ ...filter, jenisBelanja: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer text-xs"
              >
                <option value="all">Semua Jenis</option>
                <option value="LS">LS</option>
                <option value="UP">UP</option>
                <option value="GU">GU</option>
                <option value="TU">TU</option>
                <option value="Gaji dan Tunjangan">Gaji</option>
              </select>

              <select
                value={filter.limit}
                onChange={(e) => setFilter({ ...filter, limit: Number(e.target.value) })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer text-xs font-semibold"
              >
                <option value={0}>Semua SPM</option>
                <option value={20}>20 Data</option>
                <option value={50}>50 Data</option>
                <option value={100}>100 Data</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Output */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>
              REGISTER SPM (Menampilkan {totalItems === 0 ? 0 : startItemIndex} - {endItemIndex} dari Total {totalItems} Data)
            </span>
          </div>
          <span className="text-[11px] text-sky-300 font-medium">Tahun Anggaran {selectedYear}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse table-auto">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200 text-[10px] tracking-tight">
                <th className="px-2 py-2 text-center w-8">NO</th>
                <th className="px-2 py-2 min-w-[110px]">NOMOR & TGL SPM</th>
                <th className="px-2 py-2 text-center min-w-[60px]">JENIS</th>
                <th className="px-2 py-2 min-w-[100px]">BIDANG</th>
                <th className="px-2 py-2 min-w-[220px]">URAIAN PEKERJAAN</th>
                <th className="px-2 py-2 min-w-[160px]">DETAIL KONTRAK</th>
                <th className="px-2 py-2 text-center min-w-[50px]">FISIK</th>
                <th className="px-2 py-2 text-right min-w-[120px]">REALISASI SPM</th>
                <th className="px-2 py-2 text-right min-w-[110px]">PAJAK</th>
                <th className="px-2 py-2 text-center min-w-[80px]">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {paginatedSpm.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                    Tidak ada data Register SPM yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedSpm.map((spm, idx) => {
                  const itemNumber = itemsPerPage === 0 ? idx + 1 : (safeCurrentPage - 1) * itemsPerPage + idx + 1;
                  const bidang = bidangList.find((b) => String(b.id) === String(spm.bidangId) || String(b.kode) === String(spm.bidangId));
                  const kontrak = kontrakList.find((k) => String(k.id) === String(spm.kontrakId) || String(k.nomorKontrak) === String(spm.kontrakId));
                  
                  const isRowExpanded = expandAll || expandedIds.includes(spm.id);

                  const pajak = spm.pajak || {};
                  const totalPajak =
                    (pajak.ppn || 0) +
                    (pajak.pph21 || 0) +
                    (pajak.pph22 || 0) +
                    (pajak.pph23 || 0) +
                    (pajak.pphPasal4 || 0);

                  const rincianCount = spm.rincianBelanja?.length || 0;

                  return (
                    <React.Fragment key={spm.id}>
                      <tr className={`hover:bg-sky-50/50 transition-colors ${isRowExpanded ? 'bg-sky-50/30' : ''}`}>
                        <td className="px-2 py-2 text-center align-top">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-bold text-slate-600 text-[11px]">{itemNumber}</span>
                            <button
                              type="button"
                              onClick={() => toggleRowExpanded(spm.id)}
                              className="p-0.5 text-slate-400 hover:text-sky-700 hover:bg-sky-100 rounded transition-colors cursor-pointer"
                              title={isRowExpanded ? 'Sembunyikan Rincian' : 'Tampilkan Rincian Belanja & Pajak'}
                            >
                              {isRowExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                        <td className="px-2 py-2 align-top">
                          <div className="font-bold text-slate-900 font-mono text-[11px] leading-snug break-all">{spm.nomorSpm}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">
                            {formatDateIndo(spm.tanggalSpm)}
                          </div>
                        </td>

                        <td className="px-2 py-2 align-top text-center">
                          <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 font-bold rounded-md text-[9px] inline-block">
                            {spm.jenisBelanja}
                          </span>
                        </td>

                        <td className="px-2 py-2 align-top font-semibold text-slate-800 text-[11px] leading-tight break-words">
                          {bidang?.nama || '-'}
                        </td>

                        <td className="px-2 py-2 align-top font-medium text-slate-800 text-[11px] whitespace-normal break-words leading-tight">
                          {spm.uraianPekerjaan}
                        </td>

                        <td className="px-2 py-2 align-top text-slate-700 text-[11px] whitespace-normal break-words leading-tight">
                          {kontrak ? (
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-900 text-[10px]">{kontrak.uraian}</div>
                              <div className="text-[9px] text-slate-500 font-mono break-all">
                                No: {kontrak.nomorKontrak}
                              </div>
                              <div className="text-[9px] font-semibold text-emerald-700">
                                {kontrak.namaPenyedia}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Non-Kontraktual</span>
                          )}
                        </td>

                        <td className="px-2 py-2 align-top text-center font-bold text-indigo-700 text-[11px]">
                          {spm.persentaseFisik}%
                        </td>

                        <td className="px-2 py-2 align-top text-right">
                          <div className="font-extrabold text-sky-800 text-[11px]">
                            {formatRupiah(spm.realisasiSpm)}
                          </div>
                          <div className="text-[9px] font-semibold text-slate-500 mt-0.5 whitespace-nowrap">
                            {rincianCount} Rekening
                          </div>
                        </td>

                        <td className="px-2 py-2 align-top text-right">
                          <div className="font-bold text-slate-800 text-[11px]">
                            {formatRupiah(totalPajak)}
                          </div>
                          {totalPajak > 0 && (
                            <div className="flex flex-wrap gap-0.5 justify-end mt-0.5">
                              {pajak.ppn > 0 && <span className="px-1 py-0.2 bg-amber-100 text-amber-900 rounded text-[8px] font-bold">PPN</span>}
                              {pajak.pph21 > 0 && <span className="px-1 py-0.2 bg-emerald-100 text-emerald-900 rounded text-[8px] font-bold">PPh21</span>}
                              {pajak.pph22 > 0 && <span className="px-1 py-0.2 bg-blue-100 text-blue-900 rounded text-[8px] font-bold">PPh22</span>}
                              {pajak.pph23 > 0 && <span className="px-1 py-0.2 bg-purple-100 text-purple-900 rounded text-[8px] font-bold">PPh23</span>}
                              {pajak.pphPasal4 > 0 && <span className="px-1 py-0.2 bg-rose-100 text-rose-900 rounded text-[8px] font-bold">PPh4(2)</span>}
                            </div>
                          )}
                        </td>

                        <td className="px-2 py-2 align-top">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => setSpmDetailView(spm)}
                              className="p-1 text-sky-600 hover:bg-sky-100 rounded transition-colors cursor-pointer"
                              title="Lihat Detail SPM"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {canEdit && (
                              <>
                                <button
                                  onClick={() => {
                                    setSpmToEdit(spm);
                                    setShowFormModal(true);
                                  }}
                                  className="p-1 text-amber-600 hover:bg-amber-100 rounded transition-colors cursor-pointer"
                                  title="Edit SPM"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus SPM ${spm.nomorSpm}?`)) {
                                      deleteSpm(spm.id);
                                    }
                                  }}
                                  className="p-1 text-rose-600 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                                  title="Hapus SPM"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Inline Expanded Detailed Rows */}
                      {isRowExpanded && (
                        <tr className="bg-slate-50/90 border-b-2 border-sky-100">
                          <td colSpan={10} className="p-4 sm:p-5">
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-inner space-y-4 text-xs">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <div className="font-extrabold text-slate-800 flex items-center gap-2">
                                  <Receipt className="w-4 h-4 text-sky-600" />
                                  <span>Rincian Lengkap Objek Belanja & Potongan Pajak ({spm.nomorSpm})</span>
                                </div>
                                <span className="text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
                                  Total Realisasi: {formatRupiah(spm.realisasiSpm)}
                                </span>
                              </div>

                              {/* Rincian Belanja SubKegiatan & Rekening */}
                              <div className="space-y-2">
                                <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                                  1. Rincian Objek Rekening Belanja
                                </div>
                                {spm.rincianBelanja && spm.rincianBelanja.length > 0 ? (
                                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                                          <th className="p-2 w-10 text-center">No</th>
                                          <th className="p-2">Sub-Kegiatan</th>
                                          <th className="p-2">Kode & Nama Rekening</th>
                                          <th className="p-2 text-right">Nilai Realisasi</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {spm.rincianBelanja.map((rb, rIdx) => {
                                          if (!rb || typeof rb !== 'object') return null;
                                          const sub = subKegiatanList.find((s) => String(s.id) === String(rb.subKegiatanId));
                                          const rek = rekeningList.find((r) => String(r.id) === String(rb.rekeningId));
                                          const nilai = typeof rb.nilaiRealisasi === 'number' ? rb.nilaiRealisasi : parseFloat(String(rb.nilaiRealisasi || 0)) || 0;

                                          return (
                                            <tr key={rb.id || rIdx} className="hover:bg-slate-50">
                                              <td className="p-2 text-center text-slate-500 font-bold">{rIdx + 1}</td>
                                              <td className="p-2 font-medium text-slate-800">
                                                {sub ? `[${sub.kode}] ${sub.nama}` : '-'}
                                              </td>
                                              <td className="p-2 font-semibold text-slate-900">
                                                {rek ? `[${rek.kode}] ${rek.nama}` : '-'}
                                              </td>
                                              <td className="p-2 text-right font-extrabold text-sky-800">
                                                {formatRupiah(nilai)}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-medium">
                                    Belum ada rincian objek belanja terperinci untuk SPM ini.
                                  </div>
                                )}
                              </div>

                              {/* Rincian Potongan Pajak */}
                              <div className="space-y-2 pt-2 border-t border-slate-100">
                                <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center justify-between">
                                  <span>2. Rincian Potongan Pajak Daerah</span>
                                  <span className="text-slate-900 font-extrabold">
                                    Total Pajak: {formatRupiah(totalPajak)}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="text-[10px] font-bold text-slate-500">PPN</div>
                                    <div className="font-bold text-slate-900 mt-0.5">{formatRupiah(pajak.ppn || 0)}</div>
                                  </div>
                                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="text-[10px] font-bold text-slate-500">PPh 21</div>
                                    <div className="font-bold text-slate-900 mt-0.5">{formatRupiah(pajak.pph21 || 0)}</div>
                                  </div>
                                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="text-[10px] font-bold text-slate-500">PPh 22</div>
                                    <div className="font-bold text-slate-900 mt-0.5">{formatRupiah(pajak.pph22 || 0)}</div>
                                  </div>
                                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="text-[10px] font-bold text-slate-500">PPh 23</div>
                                    <div className="font-bold text-slate-900 mt-0.5">{formatRupiah(pajak.pph23 || 0)}</div>
                                  </div>
                                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl col-span-2 sm:col-span-1">
                                    <div className="text-[10px] font-bold text-slate-500">PPh Pasal 4(2)</div>
                                    <div className="font-bold text-slate-900 mt-0.5">{formatRupiah(pajak.pphPasal4 || 0)}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 font-medium">
            Menampilkan{' '}
            <strong className="text-slate-900 font-bold">{startItemIndex} - {endItemIndex}</strong>{' '}
            dari <strong className="text-slate-900 font-bold">{totalItems}</strong> Data SPM
            {itemsPerPage > 0 && totalPages > 1 && (
              <span className="text-slate-500 font-semibold ml-1">
                (Halaman {safeCurrentPage} dari {totalPages})
              </span>
            )}
          </div>

          {itemsPerPage > 0 && totalPages > 1 && (
            <div className="flex items-center gap-1 flex-wrap">
              {/* First Page */}
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed transition-colors"
                title="Halaman Pertama"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Prev Page */}
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 px-1 flex-wrap">
                {getPageNumbers(safeCurrentPage, totalPages).map((page, i) =>
                  typeof page === 'number' ? (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] h-8 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        safeCurrentPage === page
                          ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  ) : (
                    <span key={i} className="px-1 text-slate-400 font-bold">
                      ...
                    </span>
                  )
                )}
              </div>

              {/* Next Page */}
              <button
                type="button"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed transition-colors"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                type="button"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed transition-colors"
                title="Halaman Terakhir"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <SpmFormModal
          spmToEdit={spmToEdit}
          onClose={() => {
            setShowFormModal(false);
            setSpmToEdit(null);
          }}
        />
      )}

      {/* SPM Detail Modal */}
      {spmDetailView && (
        <SpmDetailModal
          spm={spmDetailView}
          onClose={() => setSpmDetailView(null)}
        />
      )}
    </div>
  );
};
