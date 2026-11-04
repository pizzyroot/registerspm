import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PengembalianBelanja, RincianPengembalianBelanja } from '../../types';
import { formatRupiah, formatDateDDMMYYYY, normalizeDateString } from '../../utils/formatters';
import {
  RotateCcw,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  RefreshCw,
  CloudUpload,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Receipt,
  Building2,
} from 'lucide-react';

export const PengembalianBelanjaView: React.FC = () => {
  const {
    selectedYear,
    bidangList,
    programList,
    kegiatanList,
    subKegiatanList,
    rekeningList,
    pengembalianBelanjaList,
    addPengembalianBelanja,
    updatePengembalianBelanja,
    deletePengembalianBelanja,
    syncSpreadsheetToWeb,
    syncWebToSpreadsheet,
    isSyncing,
    canEdit,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBidangFilter, setSelectedBidangFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PengembalianBelanja | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    nomorSts: string;
    tanggal: string;
    keterangan: string;
    rincianPengembalian: RincianPengembalianBelanja[];
  }>({
    nomorSts: '',
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: '',
    rincianPengembalian: [
      {
        id: `RP_${Date.now()}_1`,
        bidangId: '',
        programId: '',
        kegiatanId: '',
        subKegiatanId: '',
        rekeningId: '',
        nominal: 0,
      },
    ],
  });

  // Filter List
  const filteredList = useMemo(() => {
    return pengembalianBelanjaList.filter((item) => {
      if (item.tahun !== selectedYear) return false;

      // Filter query search (Nomor STS, Keterangan)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSts = item.nomorSts.toLowerCase().includes(q);
        const matchKet = item.keterangan.toLowerCase().includes(q);
        const matchRincian = item.rincianPengembalian.some((r) => {
          const rek = rekeningList.find((rk) => rk.id === r.rekeningId);
          return rek?.kode.toLowerCase().includes(q) || rek?.nama.toLowerCase().includes(q);
        });
        if (!matchSts && !matchKet && !matchRincian) return false;
      }

      // Filter Bidang
      if (selectedBidangFilter !== 'all') {
        const hasBidang = item.rincianPengembalian.some((r) => r.bidangId === selectedBidangFilter);
        if (!hasBidang) return false;
      }

      // Filter Date
      if (startDate) {
        const itemDate = normalizeDateString(item.tanggal);
        if (itemDate < startDate) return false;
      }
      if (endDate) {
        const itemDate = normalizeDateString(item.tanggal);
        if (itemDate > endDate) return false;
      }

      return true;
    });
  }, [pengembalianBelanjaList, selectedYear, searchQuery, selectedBidangFilter, startDate, endDate, rekeningList]);

  // Metric totals
  const totalNilaiPengembalian = useMemo(() => {
    return filteredList.reduce((acc, curr) => acc + (curr.totalNilai || 0), 0);
  }, [filteredList]);

  // Calculate current form total
  const formTotalNilai = useMemo(() => {
    return formData.rincianPengembalian.reduce((sum, r) => sum + (Number(r.nominal) || 0), 0);
  }, [formData.rincianPengembalian]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      nomorSts: `STS/${new Date().getMonth() + 1}/${new Date().getFullYear()}/${Math.floor(
        100 + Math.random() * 900
      )}`,
      tanggal: new Date().toISOString().split('T')[0],
      keterangan: '',
      rincianPengembalian: [
        {
          id: `RP_${Date.now()}_1`,
          bidangId: bidangList[0]?.id || '',
          programId: '',
          kegiatanId: '',
          subKegiatanId: '',
          rekeningId: '',
          nominal: 0,
        },
      ],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: PengembalianBelanja) => {
    setEditingItem(item);
    let normTanggal = item.tanggal;
    if (normTanggal.includes('-')) {
      const parts = normTanggal.split('-');
      if (parts[0].length === 2) {
        normTanggal = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    setFormData({
      nomorSts: item.nomorSts,
      tanggal: normTanggal,
      keterangan: item.keterangan || '',
      rincianPengembalian:
        item.rincianPengembalian && item.rincianPengembalian.length > 0
          ? item.rincianPengembalian.map((r) => ({ ...r }))
          : [
              {
                id: `RP_${Date.now()}_1`,
                bidangId: bidangList[0]?.id || '',
                programId: '',
                kegiatanId: '',
                subKegiatanId: '',
                rekeningId: '',
                nominal: 0,
              },
            ],
    });
    setIsModalOpen(true);
  };

  const handleAddRow = () => {
    setFormData((prev) => ({
      ...prev,
      rincianPengembalian: [
        ...prev.rincianPengembalian,
        {
          id: `RP_${Date.now()}_${prev.rincianPengembalian.length + 1}`,
          bidangId: prev.rincianPengembalian[0]?.bidangId || bidangList[0]?.id || '',
          programId: '',
          kegiatanId: '',
          subKegiatanId: '',
          rekeningId: '',
          nominal: 0,
        },
      ],
    }));
  };

  const handleRemoveRow = (index: number) => {
    if (formData.rincianPengembalian.length <= 1) {
      alert('Satu pengembalian belanja minimal harus memiliki 1 baris rincian.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      rincianPengembalian: prev.rincianPengembalian.filter((_, idx) => idx !== index),
    }));
  };

  const handleRowChange = (index: number, field: keyof RincianPengembalianBelanja, value: any) => {
    setFormData((prev) => {
      const updatedRows = [...prev.rincianPengembalian];
      const targetRow = { ...updatedRows[index], [field]: value };

      // Cascading logic
      if (field === 'bidangId') {
        targetRow.programId = '';
        targetRow.kegiatanId = '';
        targetRow.subKegiatanId = '';
        targetRow.rekeningId = '';
      } else if (field === 'programId') {
        targetRow.kegiatanId = '';
        targetRow.subKegiatanId = '';
        targetRow.rekeningId = '';
      } else if (field === 'kegiatanId') {
        targetRow.subKegiatanId = '';
        targetRow.rekeningId = '';
      } else if (field === 'subKegiatanId') {
        targetRow.rekeningId = '';
      } else if (field === 'rekeningId') {
        // Auto-derive parents if not selected
        const rek = rekeningList.find((r) => r.id === value);
        if (rek) {
          const sub = subKegiatanList.find((s) => s.id === rek.subKegiatanId);
          if (sub) {
            targetRow.subKegiatanId = sub.id;
            const keg = kegiatanList.find((k) => k.id === sub.kegiatanId);
            if (keg) {
              targetRow.kegiatanId = keg.id;
              const prog = programList.find((p) => p.id === keg.programId);
              if (prog) {
                targetRow.programId = prog.id;
                if (!targetRow.bidangId) {
                  targetRow.bidangId = prog.bidangId;
                }
              }
            }
          }
        }
      }

      updatedRows[index] = targetRow;
      return { ...prev, rincianPengembalian: updatedRows };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomorSts.trim()) {
      alert('Nomor STS wajib diisi.');
      return;
    }
    if (!formData.tanggal) {
      alert('Tanggal wajib diisi.');
      return;
    }

    // Validate rows
    for (let i = 0; i < formData.rincianPengembalian.length; i++) {
      const r = formData.rincianPengembalian[i];
      if (!r.rekeningId) {
        alert(`Baris rincian #${i + 1}: Silakan pilih Rekening Belanja.`);
        return;
      }
      if (!r.nominal || r.nominal <= 0) {
        alert(`Baris rincian #${i + 1}: Nominal pengembalian harus lebih dari 0.`);
        return;
      }
    }

    const payload: Omit<PengembalianBelanja, 'id'> = {
      nomorSts: formData.nomorSts.trim(),
      tanggal: formData.tanggal,
      keterangan: formData.keterangan.trim(),
      totalNilai: formTotalNilai,
      rincianPengembalian: formData.rincianPengembalian,
      tahun: selectedYear,
    };

    if (editingItem) {
      updatePengembalianBelanja(editingItem.id, payload);
    } else {
      addPengembalianBelanja(payload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, nomorSts: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data Pengembalian Belanja STS "${nomorSts}"?`)) {
      deletePengembalianBelanja(id);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-7 rounded-3xl text-white shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-heading">Pengembalian Belanja (STS)</h1>
          </div>
          <p className="text-slate-300 text-xs font-medium leading-relaxed max-w-2xl">
            Pencatatan Surat Tanda Setoran (STS) atas Pengembalian Realisasi Belanja ke Kas Daerah APBD
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => syncSpreadsheetToWeb()}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all font-bold text-xs shadow-xs"
            title="Tarik data terbaru dari Google Spreadsheet"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Tarik Data</span>
          </button>

          <button
            onClick={() => syncWebToSpreadsheet()}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all font-bold text-xs shadow-xs"
            title="Simpan data lokal ke Google Spreadsheet"
          >
            <CloudUpload className="w-4 h-4 text-emerald-400" />
            <span>Simpan ke Spreadsheet</span>
          </button>

          {canEdit && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all text-xs shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah STS</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total STS Pengembalian</p>
            <p className="text-2xl font-bold text-slate-800">{filteredList.length} Transaksi</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Nilai Pengembalian</p>
            <p className="text-2xl font-bold text-emerald-600">{formatRupiah(totalNilaiPengembalian)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tahun Anggaran Active</p>
            <p className="text-2xl font-bold text-blue-600">T.A. {selectedYear}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan No. STS, Keterangan, atau Kode/Nama Rekening..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-sm">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedBidangFilter}
              onChange={(e) => setSelectedBidangFilter(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-slate-700 text-sm font-medium"
            >
              <option value="all">Semua Bidang</option>
              {bidangList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.kode} - {b.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-slate-700 text-xs"
              placeholder="Dari"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-slate-700 text-xs"
              placeholder="Sampai"
            />
          </div>

          {(searchQuery || selectedBidangFilter !== 'all' || startDate || endDate) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedBidangFilter('all');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-red-600 font-semibold hover:underline px-2"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-slate-100 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">No. STS & Tanggal</th>
                <th className="py-3.5 px-4 min-w-[320px]">Detail Rincian Pengembalian Belanja</th>
                <th className="py-3.5 px-4 text-right min-w-[150px]">Total Nilai (Rp)</th>
                <th className="py-3.5 px-4 min-w-[200px]">Keterangan</th>
                {canEdit && <th className="py-3.5 px-4 text-center w-28">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="py-12 text-center text-slate-400">
                    <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold text-slate-600 text-base">Belum Ada Data Pengembalian Belanja (STS)</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery || selectedBidangFilter !== 'all' || startDate || endDate
                        ? 'Tidak ada data yang sesuai dengan kriteria filter.'
                        : 'Klik tombol "+ Tambah STS" untuk mencatat pengembalian belanja baru.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4 text-center font-medium text-slate-400 text-xs">{idx + 1}</td>
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-bold text-amber-900">{item.nomorSts}</p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateDDMMYYYY(item.tanggal)}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <div className="space-y-2">
                        {item.rincianPengembalian.map((r, rIdx) => {
                          const bd = bidangList.find((b) => b.id === r.bidangId);
                          const rek = rekeningList.find((rk) => rk.id === r.rekeningId);
                          return (
                            <div
                              key={r.id || rIdx}
                              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-slate-700">
                                  {bd ? `${bd.kode} - ${bd.nama}` : 'Bidang'}
                                </span>
                                <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                                  {formatRupiah(r.nominal)}
                                </span>
                              </div>
                              <p className="text-slate-600 font-mono">
                                <span className="font-bold text-slate-800">{rek?.kode || '-'}</span>: {rek?.nama || '-'}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-top text-right font-extrabold text-emerald-700 text-base">
                      {formatRupiah(item.totalNilai)}
                    </td>
                    <td className="py-3.5 px-4 align-top text-slate-600 text-xs leading-relaxed">
                      {item.keterangan || <span className="italic text-slate-400">-</span>}
                    </td>
                    {canEdit && (
                      <td className="py-3.5 px-4 align-top text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit STS"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.nomorSts)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus STS"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input / Edit STS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg">
                  {editingItem ? 'Edit Pengembalian Belanja (STS)' : 'Tambah Pengembalian Belanja (STS)'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Header Fields: No STS, Tanggal, Keterangan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-amber-50/50 p-4 rounded-xl border border-amber-200/60">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nomor STS <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nomorSts}
                    onChange={(e) => setFormData({ ...formData, nomorSts: e.target.value })}
                    placeholder="Contoh: STS/01/2026/001"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-medium bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Pengembalian <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-medium bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    placeholder="Contoh: Pengembalian sisa GU / Kelebihan Bayar"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-medium bg-white"
                  />
                </div>
              </div>

              {/* Detail Input Rincian (6 Columns Dynamic Rows) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">Detail Rincian Pengembalian Belanja</h4>
                    <p className="text-xs text-slate-500">
                      Pilih hierarki Bidang &rarr; Program &rarr; Kegiatan &rarr; Sub Kegiatan &rarr; Rekening Belanja
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.rincianPengembalian.map((row, idx) => {
                    // Filter options based on parents
                    const availablePrograms = programList.filter((p) => !row.bidangId || p.bidangId === row.bidangId);
                    const availableKegiatan = kegiatanList.filter((k) => !row.programId || k.programId === row.programId);
                    const availableSubKegiatan = subKegiatanList.filter(
                      (sk) => !row.kegiatanId || sk.kegiatanId === row.kegiatanId
                    );
                    const availableRekening = rekeningList.filter(
                      (rk) => !row.subKegiatanId || rk.subKegiatanId === row.subKegiatanId
                    );

                    return (
                      <div
                        key={row.id || idx}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                          <span className="font-bold text-xs text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
                            Baris #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="text-slate-400 hover:text-red-600 text-xs flex items-center gap-1 transition-colors"
                          >
                            <MinusCircle className="w-4 h-4" />
                            <span>Hapus Baris</span>
                          </button>
                        </div>

                        {/* 6 Column Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {/* 1. Bidang */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              1. Bidang
                            </label>
                            <select
                              value={row.bidangId || ''}
                              onChange={(e) => handleRowChange(idx, 'bidangId', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="">-- Pilih Bidang --</option>
                              {bidangList.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.kode} - {b.nama}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 2. Program */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              2. Program
                            </label>
                            <select
                              value={row.programId || ''}
                              onChange={(e) => handleRowChange(idx, 'programId', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="">-- Pilih Program --</option>
                              {availablePrograms.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.kode} - {p.nama}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 3. Kegiatan */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              3. Kegiatan
                            </label>
                            <select
                              value={row.kegiatanId || ''}
                              onChange={(e) => handleRowChange(idx, 'kegiatanId', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="">-- Pilih Kegiatan --</option>
                              {availableKegiatan.map((k) => (
                                <option key={k.id} value={k.id}>
                                  {k.kode} - {k.nama}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 4. Sub Kegiatan */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              4. Sub Kegiatan
                            </label>
                            <select
                              value={row.subKegiatanId || ''}
                              onChange={(e) => handleRowChange(idx, 'subKegiatanId', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="">-- Pilih Sub Kegiatan --</option>
                              {availableSubKegiatan.map((sk) => (
                                <option key={sk.id} value={sk.id}>
                                  {sk.kode} - {sk.nama}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 5. Rekening Belanja */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              5. Rekening Belanja <span className="text-red-500">*</span>
                            </label>
                            <select
                              required
                              value={row.rekeningId || ''}
                              onChange={(e) => handleRowChange(idx, 'rekeningId', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-amber-500 font-medium text-slate-800"
                            >
                              <option value="">-- Pilih Rekening Belanja --</option>
                              {availableRekening.map((rk) => (
                                <option key={rk.id} value={rk.id}>
                                  {rk.kode} - {rk.nama}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 6. Nominal (Rp) */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              6. Nominal Pengembalian (Rp) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={row.nominal || ''}
                              onChange={(e) =>
                                handleRowChange(idx, 'nominal', parseFloat(e.target.value) || 0)
                              }
                              placeholder="0"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-amber-500 text-right font-extrabold text-emerald-700"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Summary Total */}
              <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="font-bold text-slate-800 text-sm">TOTAL PENGEMBALIAN BELANJA (STS)</span>
                <span className="font-black text-emerald-700 text-xl">{formatRupiah(formTotalNilai)}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Simpan STS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
