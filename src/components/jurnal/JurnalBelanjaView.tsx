import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { JurnalBelanja, RincianRekeningJurnal } from '../../types';
import { formatRupiah, formatDateDDMMYYYY, normalizeDateString } from '../../utils/formatters';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ArrowRightLeft,
  RefreshCw,
  CloudUpload,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Scale,
  Layers,
} from 'lucide-react';

export const JurnalBelanjaView: React.FC = () => {
  const {
    selectedYear,
    bidangList,
    programList,
    kegiatanList,
    subKegiatanList,
    rekeningList,
    jurnalBelanjaList,
    addJurnalBelanja,
    updateJurnalBelanja,
    deleteJurnalBelanja,
    syncSpreadsheetToWeb,
    syncWebToSpreadsheet,
    isSyncing,
    isAdmin,
    isGuest,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBidangFilter, setSelectedBidangFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JurnalBelanja | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    nomorJurnal: string;
    tanggal: string;
    bidangId: string;
    rincianAsal: RincianRekeningJurnal[];
    rincianTujuan: RincianRekeningJurnal[];
    keterangan: string;
  }>({
    nomorJurnal: '',
    tanggal: new Date().toISOString().split('T')[0],
    bidangId: '',
    rincianAsal: [],
    rincianTujuan: [],
    keterangan: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Available Rekening Pagu for selected year
  const availableRekening = useMemo(() => {
    return rekeningList.filter((r) => r.tahun === selectedYear);
  }, [rekeningList, selectedYear]);

  // Helper auto-derive hierarchy fields from rekeningId
  const deriveHierarchyFromRekening = (rekeningId: string) => {
    const rek = rekeningList.find((r) => r.id === rekeningId);
    if (!rek) return {};
    const sub = subKegiatanList.find((s) => s.id === rek.subKegiatanId);
    if (!sub) return { subKegiatanId: rek.subKegiatanId };
    const keg = kegiatanList.find((k) => k.id === sub.kegiatanId);
    if (!keg) return { subKegiatanId: sub.id, kegiatanId: sub.kegiatanId };
    const prog = programList.find((p) => p.id === keg.programId);
    if (!prog) return { subKegiatanId: sub.id, kegiatanId: keg.id, programId: keg.programId };
    return {
      bidangId: prog.bidangId,
      programId: prog.id,
      kegiatanId: keg.id,
      subKegiatanId: sub.id,
    };
  };

  // Filtered List for Table
  const filteredList = useMemo(() => {
    return jurnalBelanjaList
      .filter((j) => j.tahun === selectedYear)
      .filter((j) => {
        if (selectedBidangFilter !== 'all' && j.bidangId !== selectedBidangFilter) return false;

        const jDate = new Date(normalizeDateString(j.tanggal));
        if (startDate && jDate < new Date(startDate)) return false;
        if (endDate && jDate > new Date(endDate)) return false;

        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const bidang = bidangList.find((b) => b.id === j.bidangId);

          const matchesNo = j.nomorJurnal.toLowerCase().includes(q);
          const matchesKet = j.keterangan.toLowerCase().includes(q);
          const matchesBidang = bidang ? bidang.nama.toLowerCase().includes(q) : false;

          // Check matches in rincianAsal
          const matchesAsal = (j.rincianAsal || []).some((ra) => {
            const rek = rekeningList.find((r) => r.id === ra.rekeningId);
            return rek
              ? rek.kode.toLowerCase().includes(q) || rek.nama.toLowerCase().includes(q)
              : false;
          });

          // Check matches in rincianTujuan
          const matchesTujuan = (j.rincianTujuan || []).some((rt) => {
            const rek = rekeningList.find((r) => r.id === rt.rekeningId);
            return rek
              ? rek.kode.toLowerCase().includes(q) || rek.nama.toLowerCase().includes(q)
              : false;
          });

          return matchesNo || matchesKet || matchesBidang || matchesAsal || matchesTujuan;
        }

        return true;
      });
  }, [jurnalBelanjaList, selectedYear, selectedBidangFilter, startDate, endDate, searchQuery, rekeningList, bidangList]);

  // Totals
  const totalJumlahPemindahan = useMemo(() => {
    return filteredList.reduce((acc, curr) => acc + (curr.jumlah || 0), 0);
  }, [filteredList]);

  // Subtotals in Modal Form
  const subtotalAsal = useMemo(() => {
    return formData.rincianAsal.reduce((acc, item) => acc + (Number(item.jumlah) || 0), 0);
  }, [formData.rincianAsal]);

  const subtotalTujuan = useMemo(() => {
    return formData.rincianTujuan.reduce((acc, item) => acc + (Number(item.jumlah) || 0), 0);
  }, [formData.rincianTujuan]);

  // Modal Handlers
  const handleOpenAddModal = () => {
    const nextSeq = String(jurnalBelanjaList.length + 1).padStart(3, '0');
    setEditingItem(null);
    const defaultBid = bidangList.length > 0 ? bidangList[0].id : '';

    setFormData({
      nomorJurnal: `JRN/${selectedYear}/${nextSeq}`,
      tanggal: new Date().toISOString().split('T')[0],
      bidangId: defaultBid,
      rincianAsal: [
        {
          id: `RA-${Date.now()}-1`,
          bidangId: defaultBid,
          programId: '',
          kegiatanId: '',
          subKegiatanId: '',
          rekeningId: availableRekening.length > 0 ? availableRekening[0].id : '',
          jumlah: 0,
        },
      ],
      rincianTujuan: [
        {
          id: `RT-${Date.now()}-1`,
          bidangId: defaultBid,
          programId: '',
          kegiatanId: '',
          subKegiatanId: '',
          rekeningId: availableRekening.length > 1 ? availableRekening[1].id : (availableRekening[0]?.id || ''),
          jumlah: 0,
        },
      ],
      keterangan: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: JurnalBelanja) => {
    if (isGuest) return;
    setEditingItem(item);

    // Normalize rincianAsal
    let rAsal = item.rincianAsal || [];
    if (rAsal.length === 0 && item.rekeningAsalId) {
      rAsal = [{ id: `RA-${Date.now()}`, rekeningId: item.rekeningAsalId, jumlah: item.jumlah }];
    }
    rAsal = rAsal.map((row) => ({
      ...row,
      ...deriveHierarchyFromRekening(row.rekeningId),
    }));

    // Normalize rincianTujuan
    let rTujuan = item.rincianTujuan || [];
    if (rTujuan.length === 0 && item.rekeningTujuanId) {
      rTujuan = [{ id: `RT-${Date.now()}`, rekeningId: item.rekeningTujuanId, jumlah: item.jumlah }];
    }
    rTujuan = rTujuan.map((row) => ({
      ...row,
      ...deriveHierarchyFromRekening(row.rekeningId),
    }));

    setFormData({
      nomorJurnal: item.nomorJurnal,
      tanggal: normalizeDateString(item.tanggal),
      bidangId: item.bidangId,
      rincianAsal: rAsal,
      rincianTujuan: rTujuan,
      keterangan: item.keterangan || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, nomor: string) => {
    if (isGuest) return;
    if (window.confirm(`Apakah Anda yakin ingin menghapus Jurnal Belanja ${nomor}?`)) {
      deleteJurnalBelanja(id);
    }
  };

  // Dynamic Row Actions for Rekening Asal
  const handleAddRowAsal = () => {
    const defaultBid = formData.bidangId || (bidangList.length > 0 ? bidangList[0].id : '');
    setFormData((prev) => ({
      ...prev,
      rincianAsal: [
        ...prev.rincianAsal,
        {
          id: `RA-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          bidangId: defaultBid,
          programId: '',
          kegiatanId: '',
          subKegiatanId: '',
          rekeningId: availableRekening.length > 0 ? availableRekening[0].id : '',
          jumlah: 0,
        },
      ],
    }));
  };

  const handleRemoveRowAsal = (id: string) => {
    if (formData.rincianAsal.length <= 1) {
      alert('Minimal harus ada 1 Rekening Asal.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      rincianAsal: prev.rincianAsal.filter((r) => r.id !== id),
    }));
  };

  const handleUpdateRowAsal = (id: string, updates: Partial<RincianRekeningJurnal>) => {
    setFormData((prev) => ({
      ...prev,
      rincianAsal: prev.rincianAsal.map((row) => {
        if (row.id !== id) return row;

        const updated = { ...row, ...updates };

        // If rekeningId was updated, derive hierarchy
        if (updates.rekeningId) {
          const derived = deriveHierarchyFromRekening(updates.rekeningId);
          return { ...updated, ...derived };
        }

        // If bidangId changed, reset sub-selections
        if (updates.bidangId !== undefined && updates.bidangId !== row.bidangId) {
          updated.programId = '';
          updated.kegiatanId = '';
          updated.subKegiatanId = '';
          updated.rekeningId = '';
        }

        // If programId changed, reset sub-selections
        if (updates.programId !== undefined && updates.programId !== row.programId) {
          updated.kegiatanId = '';
          updated.subKegiatanId = '';
          updated.rekeningId = '';
        }

        // If kegiatanId changed, reset sub-selections
        if (updates.kegiatanId !== undefined && updates.kegiatanId !== row.kegiatanId) {
          updated.subKegiatanId = '';
          updated.rekeningId = '';
        }

        // If subKegiatanId changed, reset rekening
        if (updates.subKegiatanId !== undefined && updates.subKegiatanId !== row.subKegiatanId) {
          updated.rekeningId = '';
        }

        return updated;
      }),
    }));
  };

  // Dynamic Row Actions for Rekening Tujuan
  const handleAddRowTujuan = () => {
    const defaultBid = formData.bidangId || (bidangList.length > 0 ? bidangList[0].id : '');
    setFormData((prev) => ({
      ...prev,
      rincianTujuan: [
        ...prev.rincianTujuan,
        {
          id: `RT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          bidangId: defaultBid,
          programId: '',
          kegiatanId: '',
          subKegiatanId: '',
          rekeningId: availableRekening.length > 0 ? availableRekening[0].id : '',
          jumlah: 0,
        },
      ],
    }));
  };

  const handleRemoveRowTujuan = (id: string) => {
    if (formData.rincianTujuan.length <= 1) {
      alert('Minimal harus ada 1 Rekening Tujuan.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      rincianTujuan: prev.rincianTujuan.filter((r) => r.id !== id),
    }));
  };

  const handleUpdateRowTujuan = (id: string, updates: Partial<RincianRekeningJurnal>) => {
    setFormData((prev) => ({
      ...prev,
      rincianTujuan: prev.rincianTujuan.map((row) => {
        if (row.id !== id) return row;

        const updated = { ...row, ...updates };

        // If rekeningId was updated, derive hierarchy
        if (updates.rekeningId) {
          const derived = deriveHierarchyFromRekening(updates.rekeningId);
          return { ...updated, ...derived };
        }

        // If bidangId changed, reset sub-selections
        if (updates.bidangId !== undefined && updates.bidangId !== row.bidangId) {
          updated.programId = '';
          updated.kegiatanId = '';
          updated.subKegiatanId = '';
          updated.rekeningId = '';
        }

        // If programId changed, reset sub-selections
        if (updates.programId !== undefined && updates.programId !== row.programId) {
          updated.kegiatanId = '';
          updated.subKegiatanId = '';
          updated.rekeningId = '';
        }

        // If kegiatanId changed, reset sub-selections
        if (updates.kegiatanId !== undefined && updates.kegiatanId !== row.kegiatanId) {
          updated.subKegiatanId = '';
          updated.rekeningId = '';
        }

        // If subKegiatanId changed, reset rekening
        if (updates.subKegiatanId !== undefined && updates.subKegiatanId !== row.subKegiatanId) {
          updated.rekeningId = '';
        }

        return updated;
      }),
    }));
  };

  // Save Submission
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.nomorJurnal.trim()) {
      setFormError('Nomor Jurnal wajib diisi.');
      return;
    }

    if (formData.rincianAsal.length === 0) {
      setFormError('Minimal 1 Rekening Asal harus diisi.');
      return;
    }

    if (formData.rincianTujuan.length === 0) {
      setFormError('Minimal 1 Rekening Tujuan harus diisi.');
      return;
    }

    // Check empty rekening selections
    const hasEmptyAsal = formData.rincianAsal.some((r) => !r.rekeningId);
    if (hasEmptyAsal) {
      setFormError('Pilih kode rekening untuk semua baris Rekening Asal.');
      return;
    }

    const hasEmptyTujuan = formData.rincianTujuan.some((r) => !r.rekeningId);
    if (hasEmptyTujuan) {
      setFormError('Pilih kode rekening untuk semua baris Rekening Tujuan.');
      return;
    }

    if (subtotalAsal <= 0 || subtotalTujuan <= 0) {
      setFormError('Jumlah pemindahan realisasi harus lebih dari 0.');
      return;
    }

    if (subtotalAsal !== subtotalTujuan) {
      setFormError(
        `Total Rekening Asal (${formatRupiah(subtotalAsal)}) harus SAMA dengan Total Rekening Tujuan (${formatRupiah(
          subtotalTujuan
        )}).`
      );
      return;
    }

    const firstAsalId = formData.rincianAsal[0]?.rekeningId || '';
    const firstTujuanId = formData.rincianTujuan[0]?.rekeningId || '';

    const itemPayload = {
      nomorJurnal: formData.nomorJurnal.trim(),
      tanggal: formData.tanggal,
      bidangId: formData.bidangId,
      rincianAsal: formData.rincianAsal.map((r) => {
        const derived = deriveHierarchyFromRekening(r.rekeningId);
        return { ...r, ...derived };
      }),
      rincianTujuan: formData.rincianTujuan.map((r) => {
        const derived = deriveHierarchyFromRekening(r.rekeningId);
        return { ...r, ...derived };
      }),
      jumlah: subtotalAsal,
      rekeningAsalId: firstAsalId,
      rekeningTujuanId: firstTujuanId,
      keterangan: formData.keterangan.trim(),
      tahun: selectedYear,
    };

    if (editingItem) {
      updateJurnalBelanja(editingItem.id, itemPayload);
    } else {
      addJurnalBelanja(itemPayload);
    }

    setIsModalOpen(false);
  };

  // Render a Single Dynamic Rekening Selection Row with Cascading Filters
  const renderDynamicRow = (
    row: RincianRekeningJurnal,
    index: number,
    type: 'asal' | 'tujuan'
  ) => {
    const isAsal = type === 'asal';
    const onUpdate = isAsal ? handleUpdateRowAsal : handleUpdateRowTujuan;
    const onRemove = isAsal ? handleRemoveRowAsal : handleRemoveRowTujuan;

    // Derived fields
    const derived = deriveHierarchyFromRekening(row.rekeningId);
    const rowBidangId = row.bidangId || derived.bidangId || formData.bidangId;
    const rowProgramId = row.programId || derived.programId || '';
    const rowKegiatanId = row.kegiatanId || derived.kegiatanId || '';
    const rowSubKegiatanId = row.subKegiatanId || derived.subKegiatanId || '';

    // Cascading filter lists
    const filteredPrograms = programList.filter((p) =>
      rowBidangId ? p.bidangId === rowBidangId : true
    );
    const filteredKegiatans = kegiatanList.filter((k) =>
      rowProgramId ? k.programId === rowProgramId : true
    );
    const filteredSubKegiatans = subKegiatanList.filter((sk) =>
      rowKegiatanId ? sk.kegiatanId === rowKegiatanId : true
    );
    const filteredRekenings = availableRekening.filter((r) =>
      rowSubKegiatanId ? r.subKegiatanId === rowSubKegiatanId : true
    );

    return (
      <div
        key={row.id}
        className={`p-3 rounded-2xl border space-y-2 text-xs transition ${
          isAsal
            ? 'bg-white border-rose-200/80 shadow-2xs hover:border-rose-300'
            : 'bg-white border-emerald-200/80 shadow-2xs hover:border-emerald-300'
        }`}
      >
        <div className="flex items-center justify-between font-bold text-[11px] text-slate-700 pb-1 border-b border-slate-100">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-black ${
                isAsal ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              #{index + 1}
            </span>
            <span>Rincian Rekening {isAsal ? 'Asal (Dikurangi)' : 'Tujuan (Ditambah)'}</span>
          </span>
          <button
            type="button"
            onClick={() => onRemove(row.id)}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            title="Hapus baris"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Column Grid: Bidang, Program, Kegiatan, Subkegiatan, Rekening, Nominal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2">
          {/* 1. Bidang */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">1. Bidang</label>
            <select
              value={rowBidangId}
              onChange={(e) => onUpdate(row.id, { bidangId: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-amber-400 cursor-pointer"
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
            <label className="block text-[10px] font-bold text-slate-500 mb-1">2. Program</label>
            <select
              value={rowProgramId}
              onChange={(e) => onUpdate(row.id, { programId: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-amber-400 cursor-pointer"
            >
              <option value="">-- Semua Program --</option>
              {filteredPrograms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.kode} - {p.nama}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Kegiatan */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">3. Kegiatan</label>
            <select
              value={rowKegiatanId}
              onChange={(e) => onUpdate(row.id, { kegiatanId: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-amber-400 cursor-pointer"
            >
              <option value="">-- Semua Kegiatan --</option>
              {filteredKegiatans.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.kode} - {k.nama}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Sub Kegiatan */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">4. Sub Kegiatan</label>
            <select
              value={rowSubKegiatanId}
              onChange={(e) => onUpdate(row.id, { subKegiatanId: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-amber-400 cursor-pointer"
            >
              <option value="">-- Semua Sub Kegiatan --</option>
              {filteredSubKegiatans.map((sk) => (
                <option key={sk.id} value={sk.id}>
                  {sk.kode} - {sk.nama}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Rekening Belanja */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-1">
              5. Rekening Belanja <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={row.rekeningId}
              onChange={(e) => onUpdate(row.id, { rekeningId: e.target.value })}
              className={`w-full p-2 border rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 cursor-pointer ${
                isAsal
                  ? 'bg-rose-50/40 border-rose-200 focus:ring-rose-400'
                  : 'bg-emerald-50/40 border-emerald-200 focus:ring-emerald-400'
              }`}
            >
              <option value="">-- Pilih Kode Rekening --</option>
              {filteredRekenings.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.kode} - {r.nama} (Pagu: {formatRupiah(r.pagu)})
                </option>
              ))}
            </select>
          </div>

          {/* 6. Nominal Pemindahan */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-1">
              6. Nominal (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              value={row.jumlah || ''}
              onChange={(e) => onUpdate(row.id, { jumlah: Number(e.target.value) || 0 })}
              placeholder="0"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1 font-heading">
            <ArrowRightLeft className="w-4 h-4" />
            Penyesuaian Realisasi Anggaran Multi-Rekening
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
            Jurnal Belanja
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Menu pencatatan jurnal pemindahan realisasi belanja antar kode rekening. Penginputan dilengkapi pencarian terstruktur: Bidang, Program, Kegiatan, Sub Kegiatan, Rekening, dan Nominal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tarik Data Spreadsheet Button */}
          <button
            onClick={() => syncSpreadsheetToWeb()}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200/80 transition cursor-pointer disabled:opacity-50"
            title="Tarik data terbaru dari Google Spreadsheet"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Tarik Data Spreadsheet
          </button>

          {/* Update ke Spreadsheet Button (Admin Only) */}
          {isAdmin && (
            <button
              onClick={() => syncWebToSpreadsheet()}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200/80 transition cursor-pointer disabled:opacity-50"
              title="Kirim data Jurnal Belanja ke Google Spreadsheet"
            >
              <CloudUpload className="w-4 h-4 text-emerald-600" />
              Update ke Spreadsheet
            </button>
          )}

          {/* Tambah Jurnal Belanja Button (Admin & User SPM) */}
          {!isGuest && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Tambah Jurnal Belanja
            </button>
          )}
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-3xl text-white shadow-md border border-slate-700/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Total Realisasi Dipindah
            </span>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black tracking-tight text-white">
              {formatRupiah(totalJumlahPemindahan)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Tahun Anggaran {selectedYear}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Transaksi Jurnal
            </span>
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black tracking-tight text-slate-900">
              {filteredList.length} <span className="text-sm font-bold text-slate-400">Transaksi</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Multi-Pencarian Bidang & Sub Kegiatan
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Status Integrasi
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60 inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Otomatis Terhubung Rekap & Sheet
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Tersimpan di sheet 'jurnal_belanja'
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no jurnal, keterangan, rekening..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 text-xs text-slate-800 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Bidang Dropdown Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedBidangFilter}
              onChange={(e) => setSelectedBidangFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Semua Bidang</option>
              {bidangList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.kode} - {b.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs text-slate-700 focus:outline-hidden cursor-pointer"
            />
            <span className="text-slate-400 text-[10px]">s.d.</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs text-slate-700 focus:outline-hidden cursor-pointer"
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
              className="text-xs text-amber-600 font-bold hover:underline px-2 cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-4 px-4 w-12 text-center">No</th>
                <th className="py-4 px-4">Nomor & Tanggal Jurnal</th>
                <th className="py-4 px-4">Bidang Utama</th>
                <th className="py-4 px-4">Rincian Rekening Asal (Dikurangi)</th>
                <th className="py-4 px-4">Rincian Rekening Tujuan (Ditambah)</th>
                <th className="py-4 px-4 text-right">Total Pemindahan (Rp)</th>
                <th className="py-4 px-4 max-w-xs">Keterangan</th>
                {!isGuest && <th className="py-4 px-4 text-center w-24">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {filteredList.length === 0 ? (
                <tr>
                  <td
                    colSpan={isGuest ? 7 : 8}
                    className="py-12 text-center text-slate-400 bg-slate-50/50"
                  >
                    <ArrowRightLeft className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                    Belum ada data Jurnal Belanja untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, index) => {
                  const bidang = bidangList.find((b) => b.id === item.bidangId);

                  // Normalize rincianAsal
                  let listAsal = item.rincianAsal || [];
                  if (listAsal.length === 0 && item.rekeningAsalId) {
                    listAsal = [{ id: 'RA-1', rekeningId: item.rekeningAsalId, jumlah: item.jumlah }];
                  }

                  // Normalize rincianTujuan
                  let listTujuan = item.rincianTujuan || [];
                  if (listTujuan.length === 0 && item.rekeningTujuanId) {
                    listTujuan = [{ id: 'RT-1', rekeningId: item.rekeningTujuanId, jumlah: item.jumlah }];
                  }

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">
                          {item.nomorJurnal}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDateDDMMYYYY(item.tanggal)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {bidang ? bidang.nama : '-'}
                        </span>
                      </td>

                      {/* Rekening Asal Badges */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1.5">
                          {listAsal.map((ra, idx) => {
                            const rek = rekeningList.find((r) => r.id === ra.rekeningId);
                            const derived = deriveHierarchyFromRekening(ra.rekeningId);
                            const sub = subKegiatanList.find((s) => s.id === (ra.subKegiatanId || derived.subKegiatanId));

                            return (
                              <div
                                key={ra.id || idx}
                                className="p-2 rounded-xl bg-rose-50/70 border border-rose-100/90 text-xs"
                              >
                                {rek ? (
                                  <>
                                    <div className="text-[11px] font-bold font-mono text-rose-700">
                                      {rek.kode}
                                    </div>
                                    <div className="text-xs text-slate-800 font-medium line-clamp-1">
                                      {rek.nama}
                                    </div>
                                    {sub && (
                                      <div className="text-[10px] text-slate-500 line-clamp-1">
                                        Sub: {sub.nama}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-rose-600 italic">
                                    Rekening Asal #{idx + 1}
                                  </div>
                                )}
                                <div className="text-[11px] font-extrabold text-rose-600 mt-0.5">
                                  - {formatRupiah(ra.jumlah || 0)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Rekening Tujuan Badges */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1.5">
                          {listTujuan.map((rt, idx) => {
                            const rek = rekeningList.find((r) => r.id === rt.rekeningId);
                            const derived = deriveHierarchyFromRekening(rt.rekeningId);
                            const sub = subKegiatanList.find((s) => s.id === (rt.subKegiatanId || derived.subKegiatanId));

                            return (
                              <div
                                key={rt.id || idx}
                                className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100/90 text-xs"
                              >
                                {rek ? (
                                  <>
                                    <div className="text-[11px] font-bold font-mono text-emerald-700">
                                      {rek.kode}
                                    </div>
                                    <div className="text-xs text-slate-800 font-medium line-clamp-1">
                                      {rek.nama}
                                    </div>
                                    {sub && (
                                      <div className="text-[10px] text-slate-500 line-clamp-1">
                                        Sub: {sub.nama}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-emerald-600 italic">
                                    Rekening Tujuan #{idx + 1}
                                  </div>
                                )}
                                <div className="text-[11px] font-extrabold text-emerald-600 mt-0.5">
                                  + {formatRupiah(rt.jumlah || 0)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {formatRupiah(item.jumlah)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-600 text-xs line-clamp-2">
                          {item.keterangan || '-'}
                        </p>
                      </td>

                      {!isGuest && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-90 group-hover:opacity-100">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                              title="Edit Jurnal"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.nomorJurnal)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus Jurnal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                  {editingItem ? 'Edit Jurnal Belanja' : 'Tambah Jurnal Belanja Baru'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Input hirarki: Bidang &rarr; Program &rarr; Kegiatan &rarr; Subkegiatan &rarr; Rekening &rarr; Nominal
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5 flex-1">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Nomor Jurnal */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Jurnal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nomorJurnal}
                    onChange={(e) => setFormData({ ...formData, nomorJurnal: e.target.value })}
                    placeholder="Contoh: JRN/2026/001"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white"
                  />
                </div>

                {/* Tanggal */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Jurnal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white"
                  />
                </div>

                {/* Bidang Utama */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bidang Utama Jurnal <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.bidangId}
                    onChange={(e) => setFormData({ ...formData, bidangId: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white cursor-pointer"
                  >
                    <option value="">-- Pilih Bidang Utama --</option>
                    {bidangList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.kode} - {b.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Section 1: Rekening Asal (Sumber Realisasi - Dikurangi) */}
              <div className="bg-rose-50/40 p-4 rounded-2xl border border-rose-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MinusCircle className="w-4 h-4 text-rose-600" />
                    1. Rincian Rekening Asal (Realisasi Dikurangi)
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRowAsal}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-xl transition cursor-pointer shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Tambah Rekening Asal
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.rincianAsal.map((row, index) =>
                    renderDynamicRow(row, index, 'asal')
                  )}
                </div>

                <div className="flex justify-end text-xs font-black text-rose-700 pt-1">
                  Subtotal Rekening Asal: {formatRupiah(subtotalAsal)}
                </div>
              </div>

              {/* Dynamic Section 2: Rekening Tujuan (Tujuan Realisasi - Ditambah) */}
              <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    2. Rincian Rekening Tujuan (Realisasi Ditambah)
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRowTujuan}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition cursor-pointer shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Tambah Rekening Tujuan
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.rincianTujuan.map((row, index) =>
                    renderDynamicRow(row, index, 'tujuan')
                  )}
                </div>

                <div className="flex justify-end text-xs font-black text-emerald-700 pt-1">
                  Subtotal Rekening Tujuan: {formatRupiah(subtotalTujuan)}
                </div>
              </div>

              {/* Total Balance Validation Bar */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-bold ${
                  subtotalAsal === subtotalTujuan && subtotalAsal > 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 shrink-0" />
                  <span>
                    {subtotalAsal === subtotalTujuan && subtotalAsal > 0
                      ? 'Total Pemindahan Seimbang'
                      : 'Total Pemindahan Belum Seimbang (Rekening Asal != Rekening Tujuan)'}
                  </span>
                </div>
                <div>
                  Total Jurnal: <span className="text-sm font-black">{formatRupiah(subtotalAsal)}</span>
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan / Alasan Pemindahan
                </label>
                <textarea
                  rows={2}
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Penjelasan penyesuaian atau pergeseran realisasi belanja..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white"
                ></textarea>
              </div>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={subtotalAsal !== subtotalTujuan || subtotalAsal <= 0}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Jurnal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
