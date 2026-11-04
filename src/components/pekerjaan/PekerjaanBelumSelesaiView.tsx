import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { KontrakPekerjaan, FilterPekerjaan } from '../../types';
import {
  formatRupiah,
  formatDateIndo,
  getStatusContract,
} from '../../utils/formatters';
import { exportTableToExcel, exportTableToPdf } from '../../utils/exporters';
import { KontrakFormModal } from './KontrakFormModal';
import {
  Briefcase,
  Plus,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Edit2,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers,
} from 'lucide-react';

export const PekerjaanBelumSelesaiView: React.FC = () => {
  const {
    selectedYear,
    isAdmin,
    canEdit,
    isLoggedIn,
    kontrakList,
    spmList,
    bidangList,
    deleteKontrak,
  } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [kontrakToEdit, setKontrakToEdit] = useState<KontrakPekerjaan | null>(null);

  const [filter, setFilter] = useState<FilterPekerjaan>({
    startDate: '',
    endDate: '',
    bidangId: 'all',
    searchQuery: '',
    statusProgress: 'all',
    limit: 20,
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset pagination to page 1 whenever filter or selected year changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, selectedYear]);

  // Calculate realisasi per kontrak from SPM list
  const realisasiMap = useMemo(() => {
    const map: Record<string, number> = {};
    spmList
      .filter((s) => s.tahun === selectedYear)
      .forEach((s) => {
        if (s.kontrakId) {
          map[s.kontrakId] = (map[s.kontrakId] || 0) + (s.realisasiSpm || 0);
        }
      });
    return map;
  }, [spmList, selectedYear]);

  // All contracts in selected year
  const yearKontrak = useMemo(
    () => kontrakList.filter((k) => k.tahun === selectedYear),
    [kontrakList, selectedYear]
  );

  // Summary Metrics
  const totalPaket = yearKontrak.length;
  const totalBelumSelesai = yearKontrak.filter((k) => k.persentaseFisik < 100).length;
  const totalSelesai = yearKontrak.filter((k) => k.persentaseFisik >= 100).length;
  const totalMendekatiDeadline = yearKontrak.filter((k) => {
    const status = getStatusContract(k.tanggalBerakhir, k.persentaseFisik);
    return status.isMendekati;
  }).length;

  // Filtered List
  const filteredList = useMemo(() => {
    return yearKontrak.filter((k) => {
      // Date filter
      if (filter.startDate && new Date(k.tanggalMulai) < new Date(filter.startDate)) return false;
      if (filter.endDate && new Date(k.tanggalBerakhir) > new Date(filter.endDate)) return false;

      // Bidang filter
      if (filter.bidangId !== 'all' && k.bidangId !== filter.bidangId) return false;

      // Search query (No SPM / Uraian / Kontrak)
      if (filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase();
        const matchUraian = k.uraian.toLowerCase().includes(q);
        const matchNo = k.nomorKontrak.toLowerCase().includes(q);
        const matchPenyedia = k.namaPenyedia.toLowerCase().includes(q);
        if (!matchUraian && !matchNo && !matchPenyedia) return false;
      }

      // Status progress filter
      const status = getStatusContract(k.tanggalBerakhir, k.persentaseFisik);
      if (filter.statusProgress === 'mendekati' && !status.isMendekati) return false;
      if (filter.statusProgress === 'belum_selesai' && k.persentaseFisik >= 100) return false;
      if (filter.statusProgress === 'selesai' && k.persentaseFisik < 100) return false;

      return true;
    });
  }, [yearKontrak, filter]);

  // Pagination calculations
  const itemsPerPage = filter.limit ?? 20;
  const totalItems = filteredList.length;
  const totalPages = itemsPerPage > 0 ? Math.max(1, Math.ceil(totalItems / itemsPerPage)) : 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItemIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endItemIndex = itemsPerPage === 0 ? totalItems : Math.min(safeCurrentPage * itemsPerPage, totalItems);

  // Current paginated list
  const paginatedList = useMemo(() => {
    if (itemsPerPage === 0) return filteredList;
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, itemsPerPage, safeCurrentPage]);

  // Helper to calculate page numbers
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
      'Uraian / Nama Pekerjaan',
      'Nama Penyedia / Pelaksana',
      'Nomor Kontrak',
      'Tgl Mulai Kontrak',
      'Tgl Berakhir Kontrak',
      'Nilai Kontrak (Rp)',
      'Persentase Fisik',
      'Bidang',
      'Total Realisasi SPM (Rp)',
      'Sisa Pembayaran (Rp)',
      'Status Progress',
    ];

    const rows = filteredList.map((k, idx) => {
      const b = bidangList.find((item) => item.id === k.bidangId);
      const realisasi = realisasiMap[k.id] || 0;
      const sisa = k.nilaiKontrak - realisasi;
      const status = getStatusContract(k.tanggalBerakhir, k.persentaseFisik);

      return [
        idx + 1,
        k.uraian,
        k.namaPenyedia,
        k.nomorKontrak,
        formatDateIndo(k.tanggalMulai),
        formatDateIndo(k.tanggalBerakhir),
        k.nilaiKontrak,
        `${k.persentaseFisik}%`,
        b?.nama || '-',
        realisasi,
        sisa,
        status.label,
      ];
    });

    exportTableToExcel(
      `LAPORAN PEKERJAAN & KONTRAK BELUM SELESAI TAHUN ANGGARAN ${selectedYear}`,
      headers,
      rows,
      `Pekerjaan_Belum_Selesai_${selectedYear}`
    );
  };

  // Export PDF
  const handleExportPdf = () => {
    const headers = [
      'NO',
      'URAIAN PEKERJAAN & PENYEDIA',
      'NOMOR KONTRAK',
      'TGL MULAI - BERAKHIR',
      'NILAI KONTRAK',
      'FISIK %',
      'BIDANG',
      'SISA PEMBAYARAN',
    ];

    const rows = filteredList.map((k, idx) => {
      const b = bidangList.find((item) => item.id === k.bidangId);
      const realisasi = realisasiMap[k.id] || 0;
      const sisa = k.nilaiKontrak - realisasi;

      return [
        idx + 1,
        `${k.uraian}\nPelaksana: ${k.namaPenyedia}`,
        k.nomorKontrak,
        `${formatDateIndo(k.tanggalMulai)}\ns.d ${formatDateIndo(k.tanggalBerakhir)}`,
        formatRupiah(k.nilaiKontrak),
        `${k.persentaseFisik}%`,
        b?.nama || '-',
        formatRupiah(sisa),
      ];
    });

    exportTableToPdf(
      `MONITORING PEKERJAAN & KONTRAK BELUM SELESAI (TA ${selectedYear})`,
      'Pemerintah Daerah - Kontrol Progress Fisik & Sisa Anggaran Kontrak',
      headers,
      rows,
      `Pekerjaan_Belum_Selesai_${selectedYear}`,
      'l'
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-600" />
            Kontrol Pekerjaan yang Belum Selesai & Deadline
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring paket pekerjaan fisik, persentase progress, batas masa pelaksanaan, serta sisa pembayaran.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {canEdit && (
            <button
              onClick={() => {
                setKontrakToEdit(null);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-2xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Input Kontrak Baru</span>
            </button>
          )}

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

      {/* Metric Display Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-700 rounded-2xl shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Paket Pekerjaan</div>
            <div className="text-2xl font-extrabold text-slate-900">{totalPaket}</div>
            <div className="text-[11px] text-slate-400">Kontrak di TA {selectedYear}</div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Paket Belum Selesai</div>
            <div className="text-2xl font-extrabold text-amber-600">{totalBelumSelesai}</div>
            <div className="text-[11px] text-amber-700 font-medium">Progress Fisik &lt; 100%</div>
          </div>
        </div>

        {/* Metric 3: Selesai */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Paket Selesai</div>
            <div className="text-2xl font-extrabold text-emerald-600">{totalSelesai}</div>
            <div className="text-[11px] text-emerald-700 font-medium">Progress Fisik 100%</div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-700 rounded-2xl shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Mendekati Deadline / Terlambat</div>
            <div className="text-2xl font-extrabold text-rose-600">{totalMendekatiDeadline}</div>
            <div className="text-[11px] text-rose-700 font-medium">Sisa Waktu &le; 30 Hari</div>
          </div>
        </div>
      </div>

      {/* Filter Box */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          Filter Kontrol Pekerjaan
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Tgl Mulai Dari
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
              Tgl Berakhir S.d
            </label>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Filter Bidang</label>
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

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Pencarian Pekerjaan / Penyedia</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={filter.searchQuery}
                onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
                placeholder="Nama pekerjaan / kontrak..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Status Progress</label>
            <select
              value={filter.statusProgress}
              onChange={(e) => setFilter({ ...filter, statusProgress: e.target.value as any })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer font-medium"
            >
              <option value="all">Semua Progress</option>
              <option value="belum_selesai">Status Belum Selesai (&lt;100%)</option>
              <option value="selesai">Status Selesai (100%)</option>
              <option value="mendekati">Status Mendekati Deadline (&le;30 Hari)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Tampilan Hasil</label>
            <select
              value={filter.limit ?? 20}
              onChange={(e) => setFilter({ ...filter, limit: Number(e.target.value) })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer font-semibold text-xs text-slate-800"
            >
              <option value={20}>20 Data / Hal</option>
              <option value={50}>50 Data / Hal</option>
              <option value={100}>100 Data / Hal</option>
              <option value={0}>Semua Data</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Output */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              DAFTAR KONTRAK & MONITORING FISIK (Menampilkan {totalItems === 0 ? 0 : startItemIndex} - {endItemIndex} dari Total {totalItems} Paket)
            </span>
          </div>
          <span className="text-[11px] text-sky-300">Tahun Anggaran {selectedYear}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse table-auto">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200 text-[10px] tracking-tight">
                <th className="px-2 py-2 text-center w-8">NO</th>
                <th className="px-2 py-2 min-w-[170px]">URAIAN / NAMA PEKERJAAN</th>
                <th className="px-2 py-2 min-w-[130px]">NAMA PENYEDIA/PELAKSANA</th>
                <th className="px-2 py-2 min-w-[110px]">NOMOR KONTRAK</th>
                <th className="px-2 py-2 min-w-[105px]">MASA KONTRAK</th>
                <th className="px-2 py-2 text-right min-w-[100px]">NILAI KONTRAK</th>
                <th className="px-2 py-2 text-center min-w-[65px]">FISIK (%)</th>
                <th className="px-2 py-2 min-w-[90px]">BIDANG</th>
                <th className="px-2 py-2 text-right min-w-[100px]">SISA PEMBAYARAN</th>
                <th className="px-2 py-2 text-center w-16">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                    Tidak ada paket pekerjaan yang memenuhi kriteria filter.
                  </td>
                </tr>
              ) : (
                paginatedList.map((kontrak, idx) => {
                  const bidang = bidangList.find((b) => b.id === kontrak.bidangId);
                  const realisasi = realisasiMap[kontrak.id] || 0;
                  const sisaPembayaran = kontrak.nilaiKontrak - realisasi;
                  const status = getStatusContract(kontrak.tanggalBerakhir, kontrak.persentaseFisik);
                  const itemNumber = itemsPerPage === 0 ? idx + 1 : (safeCurrentPage - 1) * itemsPerPage + idx + 1;

                  return (
                    <tr key={kontrak.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-2 py-2 text-center font-bold text-slate-500 text-[11px] align-top">{itemNumber}</td>
                      <td className="px-2 py-2 align-top">
                        <div className="font-bold text-slate-900 text-[11px] leading-tight break-words">{kontrak.uraian}</div>
                        <span className={`inline-block px-1.5 py-0.5 mt-1 rounded-md text-[9px] font-bold border ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-2 py-2 align-top font-semibold text-slate-800 text-[11px] break-words">{kontrak.namaPenyedia}</td>
                      <td className="px-2 py-2 align-top font-mono font-semibold text-slate-800 text-[10px] break-all">{kontrak.nomorKontrak}</td>
                      <td className="px-2 py-2 align-top">
                        <div className="text-[10px] text-slate-700 font-medium">{formatDateIndo(kontrak.tanggalMulai)}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5 font-semibold">s.d {formatDateIndo(kontrak.tanggalBerakhir)}</div>
                      </td>
                      <td className="px-2 py-2 align-top text-right font-bold text-slate-900 text-[11px]">
                        {formatRupiah(kontrak.nilaiKontrak)}
                      </td>
                      <td className="px-2 py-2 align-top text-center font-extrabold text-indigo-700 text-[11px]">
                        <div className="flex flex-col items-center">
                          <span>{kontrak.persentaseFisik}%</span>
                          <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="bg-indigo-600 h-full"
                              style={{ width: `${kontrak.persentaseFisik}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 align-top font-medium text-slate-700 text-[11px] break-words">{bidang?.nama || '-'}</td>
                      <td className="px-2 py-2 align-top text-right font-extrabold text-emerald-700 text-[11px]">
                        {formatRupiah(sisaPembayaran)}
                      </td>
                      <td className="px-2 py-2 align-top text-center">
                        {canEdit ? (
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              onClick={() => {
                                setKontrakToEdit(kontrak);
                                setShowModal(true);
                              }}
                              className="p-1 text-amber-600 hover:bg-amber-100 rounded transition-colors cursor-pointer"
                              title="Edit Kontrak"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus kontrak ${kontrak.nomorKontrak}?`)) {
                                  deleteKontrak(kontrak.id);
                                }
                              }}
                              className="p-1 text-rose-600 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                              title="Hapus Kontrak"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-100 text-slate-400 font-bold border border-slate-200 inline-block">
                            Read Only
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && itemsPerPage > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
            <div>
              Menampilkan <strong className="text-slate-900">{startItemIndex}</strong> s.d.{' '}
              <strong className="text-slate-900">{endItemIndex}</strong> dari total{' '}
              <strong className="text-slate-900">{totalItems}</strong> paket pekerjaan
            </div>

            <div className="flex items-center gap-1">
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
          </div>
        )}
      </div>

      {showModal && (
        <KontrakFormModal
          kontrakToEdit={kontrakToEdit}
          onClose={() => {
            setShowModal(false);
            setKontrakToEdit(null);
          }}
        />
      )}
    </div>
  );
};
