import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { KontrakPekerjaan, RegisterSpm } from '../../types';
import {
  formatRupiah,
  formatDateIndo,
  getStatusContract,
} from '../../utils/formatters';
import { exportTableToExcel, exportTableToPdf } from '../../utils/exporters';
import { SpmFormModal } from '../spm/SpmFormModal';
import { SpmDetailModal } from '../spm/SpmDetailModal';
import {
  Briefcase,
  FileText,
  Search,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Building2,
  DollarSign,
  TrendingUp,
  X,
  ChevronDown,
  Eye,
  Edit2,
  Trash2,
  Layers,
  Receipt,
  Check,
  Filter,
} from 'lucide-react';

export const KontrolKontrakSpmView: React.FC = () => {
  const {
    selectedYear,
    isAdmin,
    canEdit,
    isLoggedIn,
    kontrakList,
    spmList,
    bidangList,
    subKegiatanList,
    rekeningList,
    deleteSpm,
  } = useApp();

  // Selected contract state
  const [selectedKontrakId, setSelectedKontrakId] = useState<string>('');
  const [contractSearchQuery, setContractSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [bidangFilter, setBidangFilter] = useState<string>('all');

  // Modal states
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [spmToEdit, setSpmToEdit] = useState<RegisterSpm | null>(null);
  const [spmDetailView, setSpmDetailView] = useState<RegisterSpm | null>(null);

  // Contracts for current selected budget year
  const yearKontrak = useMemo(
    () => kontrakList.filter((k) => k.tahun === selectedYear),
    [kontrakList, selectedYear]
  );

  // Filtered contract list for selection dropdown / list
  const filteredKontrakList = useMemo(() => {
    return yearKontrak.filter((k) => {
      if (bidangFilter !== 'all' && k.bidangId !== bidangFilter) return false;
      if (contractSearchQuery.trim()) {
        const q = contractSearchQuery.toLowerCase();
        const matchNo = k.nomorKontrak.toLowerCase().includes(q);
        const matchUraian = k.uraian.toLowerCase().includes(q);
        const matchPenyedia = k.namaPenyedia.toLowerCase().includes(q);
        if (!matchNo && !matchUraian && !matchPenyedia) return false;
      }
      return true;
    });
  }, [yearKontrak, bidangFilter, contractSearchQuery]);

  // Set default selected contract if none selected or if selected ID is invalid in year
  const currentSelectedKontrak = useMemo(() => {
    if (selectedKontrakId) {
      const found = yearKontrak.find((k) => k.id === selectedKontrakId);
      if (found) return found;
    }
    return filteredKontrakList.length > 0 ? filteredKontrakList[0] : null;
  }, [selectedKontrakId, yearKontrak, filteredKontrakList]);

  // All SPM linked to current selected contract
  const contractSpms = useMemo(() => {
    if (!currentSelectedKontrak) return [];
    return spmList
      .filter(
        (s) =>
          s.tahun === selectedYear &&
          s.kontrakId === currentSelectedKontrak.id
      )
      .sort((a, b) => new Date(a.tanggalSpm).getTime() - new Date(b.tanggalSpm).getTime());
  }, [spmList, selectedYear, currentSelectedKontrak]);

  // Financial summary for selected contract
  const totalRealisasiSpm = useMemo(() => {
    return contractSpms.reduce((acc, curr) => acc + (curr.realisasiSpm || 0), 0);
  }, [contractSpms]);

  const sisaNilaiKontrak = useMemo(() => {
    if (!currentSelectedKontrak) return 0;
    return currentSelectedKontrak.nilaiKontrak - totalRealisasiSpm;
  }, [currentSelectedKontrak, totalRealisasiSpm]);

  const persentasePencairan = useMemo(() => {
    if (!currentSelectedKontrak || currentSelectedKontrak.nilaiKontrak <= 0) return 0;
    return Math.min(100, (totalRealisasiSpm / currentSelectedKontrak.nilaiKontrak) * 100);
  }, [currentSelectedKontrak, totalRealisasiSpm]);

  // Export Excel for Kontrak & SPM
  const handleExportExcel = () => {
    if (!currentSelectedKontrak) return;

    const bidang = bidangList.find((b) => b.id === currentSelectedKontrak.bidangId);

    const headers = [
      'No',
      'Nomor SPM',
      'Tanggal SPM',
      'Uraian SPM',
      'Jenis Belanja',
      'Realisasi SPM (Rp)',
      'Kumulatif Realisasi (Rp)',
      'Sisa Kontrak (Rp)',
      'Total Potongan Pajak (Rp)',
    ];

    let runningTotal = 0;
    const rows = contractSpms.map((s, idx) => {
      runningTotal += s.realisasiSpm || 0;
      const sisaAfterSpm = currentSelectedKontrak.nilaiKontrak - runningTotal;
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
        s.uraianPekerjaan,
        s.jenisBelanja,
        s.realisasiSpm,
        runningTotal,
        sisaAfterSpm,
        totalPajak,
      ];
    });

    // Add summary row
    rows.push([
      'TOTAL',
      `${contractSpms.length} SPM`,
      '-',
      'TOTAL REALISASI PEMBAYARAN KONTRAK',
      '-',
      totalRealisasiSpm,
      totalRealisasiSpm,
      sisaNilaiKontrak,
      contractSpms.reduce(
        (acc, s) =>
          acc +
          ((s.pajak?.ppn || 0) +
            (s.pajak?.pph21 || 0) +
            (s.pajak?.pph22 || 0) +
            (s.pajak?.pph23 || 0) +
            (s.pajak?.pphPasal4 || 0)),
        0
      ),
    ]);

    exportTableToExcel(
      `LAPORAN KONTROL KONTRAK & REALISASI SPM - ${currentSelectedKontrak.nomorKontrak} (TA ${selectedYear})`,
      headers,
      rows,
      `Kontrol_Kontrak_${currentSelectedKontrak.nomorKontrak.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedYear}`
    );
  };

  // Export PDF for Kontrak & SPM
  const handleExportPdf = () => {
    if (!currentSelectedKontrak) return;

    const bidang = bidangList.find((b) => b.id === currentSelectedKontrak.bidangId);

    const headers = [
      'NO',
      'NOMOR & TGL SPM',
      'URAIAN PEKERJAAN SPM',
      'JENIS',
      'REALISASI SPM',
      'KUMULATIF %',
      'SISA KONTRAK',
    ];

    let runningTotal = 0;
    const rows = contractSpms.map((s, idx) => {
      runningTotal += s.realisasiSpm || 0;
      const percent = (runningTotal / currentSelectedKontrak.nilaiKontrak) * 100;
      const sisaAfterSpm = currentSelectedKontrak.nilaiKontrak - runningTotal;

      return [
        idx + 1,
        `${s.nomorSpm}\n${formatDateIndo(s.tanggalSpm)}`,
        s.uraianPekerjaan,
        s.jenisBelanja,
        formatRupiah(s.realisasiSpm),
        `${percent.toFixed(1)}%`,
        formatRupiah(sisaAfterSpm),
      ];
    });

    exportTableToPdf(
      `KONTROL REALISASI KONTRAK PEKERJAAN & REKAP SPM (TA ${selectedYear})`,
      `Kontrak: [${currentSelectedKontrak.nomorKontrak}] ${currentSelectedKontrak.uraian} | Penyedia: ${currentSelectedKontrak.namaPenyedia}`,
      headers,
      rows,
      `Kontrol_Kontrak_${currentSelectedKontrak.nomorKontrak.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedYear}`,
      'l'
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 font-heading">
            <Briefcase className="w-6 h-6 text-sky-700" />
            Kontrol Kontrak Pekerjaan & SPM
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pilih paket pekerjaan untuk memantau pencairan realisasi SPM, akumulasi keuangan, persentase fisik, serta sisa anggaran kontrak.
          </p>
        </div>

        {currentSelectedKontrak && (
          <div className="flex items-center flex-wrap gap-2">
            {canEdit && (
              <button
                onClick={() => {
                  setSpmToEdit(null);
                  setShowFormModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-2xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Input SPM Kontrak Ini</span>
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
        )}
      </div>

      {/* Contract Search & Selector Section */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4 text-sky-600" />
            Pencarian & Pilih Kontrak Pekerjaan (TA {selectedYear})
          </label>
          <span className="text-[11px] text-slate-500 font-semibold">
            Menampilkan {filteredKontrakList.length} dari {yearKontrak.length} Kontrak
          </span>
        </div>

        {/* Filters & Dropdown Combobox */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Bidang Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter Bidang</label>
            <select
              value={bidangFilter}
              onChange={(e) => setBidangFilter(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer font-medium text-slate-800"
            >
              <option value="all">-- Semua Bidang --</option>
              {bidangList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Search Query Input */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Kata Kunci (No. Kontrak / Uraian Pekerjaan / Penyedia)
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={contractSearchQuery}
                onChange={(e) => setContractSearchQuery(e.target.value)}
                placeholder="Cari nomor kontrak, nama pekerjaan, atau CV/PT penyedia..."
                className="w-full text-xs pl-8 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800"
              />
              {contractSearchQuery && (
                <button
                  type="button"
                  onClick={() => setContractSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dropdown Selector Combobox */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Pilih Kontrak Pekerjaan Utama:
          </label>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full text-xs p-3 bg-slate-50 border rounded-2xl flex items-center justify-between cursor-pointer transition-all text-left ${
              isDropdownOpen
                ? 'border-sky-500 ring-2 ring-sky-500/20 bg-white'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {currentSelectedKontrak ? (
              <div className="flex items-center gap-2 truncate pr-2">
                <Briefcase className="w-4 h-4 text-sky-700 shrink-0" />
                <span className="truncate">
                  <span className="font-mono font-bold text-sky-700 mr-1.5">
                    [{currentSelectedKontrak.nomorKontrak}]
                  </span>
                  <strong className="text-slate-900">{currentSelectedKontrak.uraian}</strong>
                  <span className="text-slate-600 font-medium ml-1">
                    ({currentSelectedKontrak.namaPenyedia}) - {formatRupiah(currentSelectedKontrak.nilaiKontrak)}
                  </span>
                </span>
              </div>
            ) : (
              <span className="text-slate-400 italic">-- Pilih Paket Pekerjaan --</span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-sky-600' : ''
              }`}
            />
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100">
                {filteredKontrakList.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 italic">
                    Tidak ada data kontrak pekerjaan yang sesuai.
                  </div>
                ) : (
                  filteredKontrakList.map((k) => {
                    const isSelected = currentSelectedKontrak?.id === k.id;
                    const b = bidangList.find((item) => item.id === k.bidangId);
                    const status = getStatusContract(k.tanggalBerakhir, k.persentaseFisik);

                    return (
                      <div
                        key={k.id}
                        onClick={() => {
                          setSelectedKontrakId(k.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`p-3 text-xs hover:bg-sky-50/70 cursor-pointer transition-colors ${
                          isSelected ? 'bg-sky-50 border-l-4 border-sky-600 pl-2.5' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded text-[11px]">
                              [{k.nomorKontrak}]
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 text-xs">
                            {formatRupiah(k.nilaiKontrak)}
                          </span>
                        </div>

                        <p className="font-bold text-slate-800 line-clamp-1">{k.uraian}</p>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                          <span>
                            Penyedia: <strong className="text-slate-700">{k.namaPenyedia}</strong> | Bidang:{' '}
                            <strong className="text-slate-700">{b?.nama || '-'}</strong>
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Selected Contract Summary Card */}
      {currentSelectedKontrak ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Card Top Banner */}
          <div className="p-5 bg-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-amber-400 text-sm tracking-wider">
                  KONTRAK: [{currentSelectedKontrak.nomorKontrak}]
                </span>
                {(() => {
                  const status = getStatusContract(
                    currentSelectedKontrak.tanggalBerakhir,
                    currentSelectedKontrak.persentaseFisik
                  );
                  return (
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${status.color}`}>
                      {status.label}
                    </span>
                  );
                })()}
              </div>
              <h3 className="text-base font-extrabold text-white mt-1 leading-snug">
                {currentSelectedKontrak.uraian}
              </h3>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">NILAI KONTRAK PEKERJAAN</div>
              <div className="text-xl font-black text-amber-400">
                {formatRupiah(currentSelectedKontrak.nilaiKontrak)}
              </div>
            </div>
          </div>

          {/* Details & Metrics Grid */}
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50">
            {/* Box 1: Penyedia & Bidang */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                Penyedia / Pelaksana
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                {currentSelectedKontrak.namaPenyedia}
              </div>
              <div className="text-xs text-slate-500 font-medium pt-1 border-t border-slate-100">
                Bidang:{' '}
                <span className="font-bold text-slate-700">
                  {bidangList.find((b) => b.id === currentSelectedKontrak.bidangId)?.nama || '-'}
                </span>
              </div>
            </div>

            {/* Box 2: Masa Pelaksanaan */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Masa Pelaksanaan
              </div>
              <div className="text-xs font-bold text-slate-800">
                {formatDateIndo(currentSelectedKontrak.tanggalMulai)} s.d.{' '}
                {formatDateIndo(currentSelectedKontrak.tanggalBerakhir)}
              </div>
              <div className="text-xs text-amber-700 font-bold pt-1 border-t border-slate-100 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {getStatusContract(
                    currentSelectedKontrak.tanggalBerakhir,
                    currentSelectedKontrak.persentaseFisik
                  ).label}
                </span>
              </div>
            </div>

            {/* Box 3: Progress Fisik Pekerjaan */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                Progress Fisik Kontrak
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-indigo-700">
                  {currentSelectedKontrak.persentaseFisik}%
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">Target 100%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${currentSelectedKontrak.persentaseFisik}%` }}
                />
              </div>
            </div>

            {/* Box 4: Total Realisasi & Sisa Kontrak */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Realisasi & Sisa Kontrak
              </div>
              <div className="text-xs text-slate-600">
                Realisasi SPM:{' '}
                <strong className="text-emerald-700 font-extrabold">
                  {formatRupiah(totalRealisasiSpm)} ({persentasePencairan.toFixed(1)}%)
                </strong>
              </div>
              <div className="text-xs text-slate-600 font-medium">
                Sisa Kontrak:{' '}
                <strong className="text-rose-700 font-extrabold">
                  {formatRupiah(sisaNilaiKontrak)}
                </strong>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${persentasePencairan}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Belum Ada Kontrak Terpilih</h3>
          <p className="text-xs text-slate-500">
            Silakan pilih atau cari paket kontrak pekerjaan pada pencarian di atas untuk melihat data SPM.
          </p>
        </div>
      )}

      {/* Section 3: Tabel SPM dari Kontrak Tersebut */}
      {currentSelectedKontrak && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Header */}
          <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  DAFTAR SPM TERKAIT KONTRAK: [{currentSelectedKontrak.nomorKontrak}]
                </h3>
                <p className="text-[11px] text-slate-300 font-medium">
                  {contractSpms.length} Surat Perintah Membayar (SPM) diterbitkan untuk kontrak ini
                </p>
              </div>
            </div>

            {canEdit && (
              <button
                onClick={() => {
                  setSpmToEdit(null);
                  setShowFormModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Input SPM Baru</span>
              </button>
            )}
          </div>

          {/* SPM Table Body */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse table-auto">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200 text-[10px] tracking-tight">
                  <th className="px-2 py-2 text-center w-8">NO</th>
                  <th className="px-2 py-2 min-w-[110px]">NOMOR & TGL SPM</th>
                  <th className="px-2 py-2 min-w-[160px]">URAIAN PEKERJAAN SPM</th>
                  <th className="px-2 py-2 text-center min-w-[60px]">JENIS</th>
                  <th className="px-2 py-2 text-right min-w-[100px]">REALISASI SPM</th>
                  <th className="px-2 py-2 text-center min-w-[65px]">KUMULATIF %</th>
                  <th className="px-2 py-2 text-right min-w-[100px]">SISA SALDO KONTRAK</th>
                  <th className="px-2 py-2 text-right min-w-[90px]">POTONGAN PAJAK</th>
                  <th className="px-2 py-2 text-center w-16">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {contractSpms.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
                        <h4 className="text-xs font-bold text-slate-700">
                          Belum Ada SPM yang Dikoneksikan dengan Kontrak Ini
                        </h4>
                        <p className="text-xs text-slate-500">
                          Belum ada penerbitan Surat Perintah Membayar (SPM) untuk kontrak [{currentSelectedKontrak.nomorKontrak}].{canEdit && ' Klik tombol di bawah untuk menginput SPM baru.'}
                        </p>
                        {canEdit && (
                          <button
                            onClick={() => {
                              setSpmToEdit(null);
                              setShowFormModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Input SPM Baru Untuk Kontrak Ini</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    let runningRealisasi = 0;
                    return contractSpms.map((spm, idx) => {
                      runningRealisasi += spm.realisasiSpm || 0;
                      const kumulatifPercent =
                        currentSelectedKontrak.nilaiKontrak > 0
                          ? (runningRealisasi / currentSelectedKontrak.nilaiKontrak) * 100
                          : 0;
                      const sisaSaldo = currentSelectedKontrak.nilaiKontrak - runningRealisasi;

                      const totalPajakSpm =
                        (spm.pajak?.ppn || 0) +
                        (spm.pajak?.pph21 || 0) +
                        (spm.pajak?.pph22 || 0) +
                        (spm.pajak?.pph23 || 0) +
                        (spm.pajak?.pphPasal4 || 0);

                      return (
                        <tr key={spm.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-2 py-2 text-center font-bold text-slate-500 text-[11px] align-top">{idx + 1}</td>
                          <td className="px-2 py-2 align-top">
                            <div className="font-mono font-bold text-slate-900 text-[10px] leading-tight break-all">{spm.nomorSpm}</div>
                            <div className="text-[9px] text-slate-500 mt-0.5 whitespace-nowrap">
                              {formatDateIndo(spm.tanggalSpm)}
                            </div>
                          </td>
                          <td className="px-2 py-2 align-top font-semibold text-slate-800 text-[11px]">
                            <div className="leading-tight break-words">{spm.uraianPekerjaan}</div>
                            {spm.rincianBelanja.length > 0 && (
                              <div className="text-[9px] text-slate-500 font-normal mt-0.5">
                                {spm.rincianBelanja.length} Rekening Belanja
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2 align-top text-center">
                            <span className="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
                              {spm.jenisBelanja}
                            </span>
                          </td>
                          <td className="px-2 py-2 align-top text-right font-extrabold text-emerald-700 text-[11px]">
                            {formatRupiah(spm.realisasiSpm)}
                          </td>
                          <td className="px-2 py-2 align-top text-center font-bold text-indigo-700 text-[11px]">
                            {kumulatifPercent.toFixed(1)}%
                          </td>
                          <td className="px-2 py-2 align-top text-right font-extrabold text-slate-900 text-[11px]">
                            {formatRupiah(sisaSaldo)}
                          </td>
                          <td className="px-2 py-2 align-top text-right font-semibold text-amber-700 text-[11px]">
                            {totalPajakSpm > 0 ? formatRupiah(totalPajakSpm) : '-'}
                          </td>
                          <td className="px-2 py-2 align-top text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                onClick={() => setSpmDetailView(spm)}
                                className="p-1 text-sky-600 hover:bg-sky-100 rounded transition-colors cursor-pointer"
                                title="Lihat Rincian SPM"
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
                      );
                    });
                  })()
                )}
              </tbody>

              {/* Summary Footer */}
              {contractSpms.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900 text-white font-extrabold text-[11px]">
                    <td colSpan={4} className="px-2 py-2 text-right uppercase tracking-wider">
                      TOTAL REALISASI SPM KONTRAK:
                    </td>
                    <td className="px-2 py-2 text-right font-black text-amber-400 text-[11px]">
                      {formatRupiah(totalRealisasiSpm)}
                    </td>
                    <td className="px-2 py-2 text-center font-bold text-amber-300 text-[11px]">
                      {persentasePencairan.toFixed(1)}%
                    </td>
                    <td className="px-2 py-2 text-right font-black text-rose-400 text-[11px]">
                      {formatRupiah(sisaNilaiKontrak)}
                    </td>
                    <td className="px-2 py-2 text-right font-bold text-slate-300 text-[11px]">
                      {formatRupiah(
                        contractSpms.reduce(
                          (acc, s) =>
                            acc +
                            ((s.pajak?.ppn || 0) +
                              (s.pajak?.pph21 || 0) +
                              (s.pajak?.pph22 || 0) +
                              (s.pajak?.pph23 || 0) +
                              (s.pajak?.pphPasal4 || 0)),
                          0
                        )
                      )}
                    </td>
                    <td className="px-2 py-2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* SPM Form Modal for Adding / Editing SPM */}
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
