import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import {
  RegisterSpm,
  JenisBelanja,
  RincianBelanjaSpm,
  PajakSpm,
} from '../../types';
import { formatRupiah, calculateTaxEstimates } from '../../utils/formatters';
import { X, Plus, Trash2, Calculator, Check, AlertCircle, Search, ChevronDown, FileText } from 'lucide-react';

interface SpmFormModalProps {
  spmToEdit?: RegisterSpm | null;
  onClose: () => void;
}

export const SpmFormModal: React.FC<SpmFormModalProps> = ({ spmToEdit, onClose }) => {
  const {
    selectedYear,
    bidangList,
    programList,
    kegiatanList,
    subKegiatanList,
    rekeningList,
    kontrakList,
    addSpm,
    updateSpm,
  } = useApp();

  // Primary SPM Fields
  const [nomorSpm, setNomorSpm] = useState(
    spmToEdit?.nomorSpm || `0000${Math.floor(Math.random() * 90) + 10}/SPM-LS/${selectedYear}`
  );
  const [tanggalSpm, setTanggalSpm] = useState(
    spmToEdit?.tanggalSpm || new Date().toISOString().slice(0, 10)
  );
  const [jenisBelanja, setJenisBelanja] = useState<JenisBelanja>(
    spmToEdit?.jenisBelanja || 'LS'
  );
  const [bidangId, setBidangId] = useState(spmToEdit?.bidangId || bidangList[0]?.id || '');
  const [kontrakId, setKontrakId] = useState(spmToEdit?.kontrakId || '');
  const [contractSearchQuery, setContractSearchQuery] = useState('');
  const [isContractDropdownOpen, setIsContractDropdownOpen] = useState(false);
  const [uraianPekerjaan, setUraianPekerjaan] = useState(spmToEdit?.uraianPekerjaan || '');
  const [persentaseFisik, setPersentaseFisik] = useState<number>(
    spmToEdit?.persentaseFisik || 100
  );

  // Filter contract list by current year and search query
  const filteredKontrakList = kontrakList.filter((k) => {
    if (k.tahun !== selectedYear) return false;
    if (!contractSearchQuery.trim()) return true;
    const q = contractSearchQuery.toLowerCase();
    return (
      k.nomorKontrak.toLowerCase().includes(q) ||
      k.uraian.toLowerCase().includes(q) ||
      k.namaPenyedia.toLowerCase().includes(q)
    );
  });

  const selectedKontrak = kontrakList.find((k) => k.id === kontrakId);

  // Rincian Belanja Multi-Row State
  const [rincianList, setRincianList] = useState<RincianBelanjaSpm[]>(
    spmToEdit?.rincianBelanja || []
  );

  // Tax State
  const [pajak, setPajak] = useState<PajakSpm>(
    spmToEdit?.pajak || {
      ppn: 0,
      pph21: 0,
      pph22: 0,
      pph23: 0,
      pphPasal4: 0,
    }
  );

  const [errorMsg, setErrorMsg] = useState('');

  // Total Realisasi calculated from rincianList sum
  const totalRealisasi = rincianList.reduce((acc, r) => acc + (r.nilaiRealisasi || 0), 0);

  // When selected contract changes, auto fill uraian & bidang & physical % if empty
  useEffect(() => {
    if (kontrakId) {
      const k = kontrakList.find((item) => item.id === kontrakId);
      if (k) {
        if (!uraianPekerjaan) setUraianPekerjaan(`Pembayaran untuk: ${k.uraian}`);
        setBidangId(k.bidangId);
        setPersentaseFisik(k.persentaseFisik);
      }
    }
  }, [kontrakId]);

  // Recalculate automatic taxes when totalRealisasi changes
  const handleAutoCalculateTax = () => {
    const est = calculateTaxEstimates(totalRealisasi);
    setPajak(est);
  };

  // Add a new row to rincian belanja
  const handleAddRincianRow = () => {
    const defaultBidang = bidangId || bidangList[0]?.id || '';
    const progs = programList.filter((p) => p.bidangId === defaultBidang);
    const defaultProg = progs[0]?.id || '';
    const kegs = kegiatanList.filter((k) => k.programId === defaultProg);
    const defaultKeg = kegs[0]?.id || '';
    const subs = subKegiatanList.filter((sk) => sk.kegiatanId === defaultKeg);
    const defaultSub = subs[0]?.id || '';
    const reks = rekeningList.filter((r) => r.subKegiatanId === defaultSub && r.tahun === selectedYear);
    const defaultRek = reks[0]?.id || '';

    const newRow: RincianBelanjaSpm = {
      id: `RC_${Date.now()}_${Math.floor(Math.random() * 100)}`,
      bidangId: defaultBidang,
      programId: defaultProg,
      kegiatanId: defaultKeg,
      subKegiatanId: defaultSub,
      rekeningId: defaultRek,
      nilaiRealisasi: 0,
    };
    setRincianList((prev) => [...prev, newRow]);
  };

  const handleUpdateRincianRow = (
    id: string,
    field: keyof RincianBelanjaSpm,
    val: any
  ) => {
    setRincianList((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: val };

        // Cascading selects reset if parent changes
        if (field === 'bidangId') {
          const progs = programList.filter((p) => p.bidangId === val);
          updated.programId = progs[0]?.id || '';
          const kegs = kegiatanList.filter((k) => k.programId === updated.programId);
          updated.kegiatanId = kegs[0]?.id || '';
          const subs = subKegiatanList.filter((sk) => sk.kegiatanId === updated.kegiatanId);
          updated.subKegiatanId = subs[0]?.id || '';
          const reks = rekeningList.filter(
            (rk) => rk.subKegiatanId === updated.subKegiatanId && rk.tahun === selectedYear
          );
          updated.rekeningId = reks[0]?.id || '';
        } else if (field === 'programId') {
          const kegs = kegiatanList.filter((k) => k.programId === val);
          updated.kegiatanId = kegs[0]?.id || '';
          const subs = subKegiatanList.filter((sk) => sk.kegiatanId === updated.kegiatanId);
          updated.subKegiatanId = subs[0]?.id || '';
          const reks = rekeningList.filter(
            (rk) => rk.subKegiatanId === updated.subKegiatanId && rk.tahun === selectedYear
          );
          updated.rekeningId = reks[0]?.id || '';
        } else if (field === 'kegiatanId') {
          const subs = subKegiatanList.filter((sk) => sk.kegiatanId === val);
          updated.subKegiatanId = subs[0]?.id || '';
          const reks = rekeningList.filter(
            (rk) => rk.subKegiatanId === updated.subKegiatanId && rk.tahun === selectedYear
          );
          updated.rekeningId = reks[0]?.id || '';
        } else if (field === 'subKegiatanId') {
          const reks = rekeningList.filter(
            (rk) => rk.subKegiatanId === val && rk.tahun === selectedYear
          );
          updated.rekeningId = reks[0]?.id || '';
        }

        return updated;
      })
    );
  };

  const handleRemoveRincianRow = (id: string) => {
    setRincianList((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nomorSpm.trim()) {
      setErrorMsg('Nomor SPM wajib diisi!');
      return;
    }
    if (!uraianPekerjaan.trim()) {
      setErrorMsg('Uraian pekerjaan wajib diisi!');
      return;
    }
    if (rincianList.length === 0) {
      setErrorMsg('Harap tambahkan setidaknya 1 rincian belanja SPM!');
      return;
    }

    // Auto derive bidangId from the first rincian belanja row
    const derivedBidangId = rincianList[0]?.bidangId || bidangId || bidangList[0]?.id || '';

    const payload: Omit<RegisterSpm, 'id'> = {
      nomorSpm,
      tanggalSpm,
      jenisBelanja,
      bidangId: derivedBidangId,
      kontrakId: kontrakId || undefined,
      uraianPekerjaan,
      persentaseFisik,
      rincianBelanja: rincianList,
      realisasiSpm: totalRealisasi,
      pajak,
      tahun: selectedYear,
    };

    if (spmToEdit) {
      updateSpm(spmToEdit.id, payload);
    } else {
      addSpm(payload);
    }

    onClose();
  };

  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === containerRef.current) onClose();
      }}
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col relative z-10 animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-base text-white">
              {spmToEdit ? 'Edit Register SPM' : 'Input Register SPM Baru'}
            </h3>
            <p className="text-xs text-sky-400">Tahun Anggaran {selectedYear}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto grow">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: SPM Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor SPM *
              </label>
              <input
                type="text"
                required
                value={nomorSpm}
                onChange={(e) => setNomorSpm(e.target.value)}
                placeholder="Contoh: 00012/SPM-LS/2026"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal SPM *
              </label>
              <input
                type="date"
                required
                value={tanggalSpm}
                onChange={(e) => setTanggalSpm(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jenis Belanja *
              </label>
              <select
                value={jenisBelanja}
                onChange={(e) => setJenisBelanja(e.target.value as JenisBelanja)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="LS">LS (Langsung)</option>
                <option value="UP">UP (Uang Persediaan)</option>
                <option value="GU">GU (Ganti Uang)</option>
                <option value="TU">TU (Tambahan Uang)</option>
                <option value="Gaji dan Tunjangan">Gaji dan Tunjangan</option>
              </select>
            </div>

            <div className="md:col-span-3 relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Koneksi Kontrak Pekerjaan (Opsional)
                </label>
                {kontrakId && (
                  <button
                    type="button"
                    onClick={() => {
                      setKontrakId('');
                      setContractSearchQuery('');
                    }}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>Lepas Kontrak</span>
                  </button>
                )}
              </div>

              {/* Trigger Button / Display */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsContractDropdownOpen(!isContractDropdownOpen)}
                  className={`w-full text-xs p-2.5 bg-slate-50 border rounded-xl flex items-center justify-between cursor-pointer transition-all text-left ${
                    isContractDropdownOpen
                      ? 'border-sky-500 ring-2 ring-sky-500/20 bg-white'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileText className={`w-4 h-4 shrink-0 ${selectedKontrak ? 'text-sky-600' : 'text-slate-400'}`} />
                    {selectedKontrak ? (
                      <span className="truncate font-medium text-slate-800">
                        <span className="font-mono font-bold text-sky-700 mr-1">[{selectedKontrak.nomorKontrak}]</span>
                        {selectedKontrak.uraian} - <span className="font-semibold text-slate-600">{selectedKontrak.namaPenyedia}</span> ({formatRupiah(selectedKontrak.nilaiKontrak)})
                      </span>
                    ) : (
                      <span className="text-slate-500 font-normal">
                        -- Tanpa Kontrak (Non-Kontraktual / UP / GU / Gaji) --
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isContractDropdownOpen ? 'rotate-180 text-sky-600' : ''}`} />
                  </div>
                </button>

                {/* Search & Selection Dropdown Menu */}
                {isContractDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsContractDropdownOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-72">
                      {/* Search Bar Input */}
                      <div className="p-2.5 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            autoFocus
                            value={contractSearchQuery}
                            onChange={(e) => setContractSearchQuery(e.target.value)}
                            placeholder="Cari No. Kontrak, Uraian Pekerjaan, atau Nama Penyedia..."
                            className="w-full text-xs pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800"
                          />
                          {contractSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setContractSearchQuery('')}
                              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-1 font-medium">
                          <span>{filteredKontrakList.length} kontrak ditemukan</span>
                          {contractSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setContractSearchQuery('')}
                              className="text-sky-600 hover:underline cursor-pointer"
                            >
                              Reset Pencarian
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Contract Items List */}
                      <div className="overflow-y-auto divide-y divide-slate-100 max-h-56">
                        {/* Option: Tanpa Kontrak */}
                        <div
                          onClick={() => {
                            setKontrakId('');
                            setIsContractDropdownOpen(false);
                          }}
                          className={`p-2.5 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
                            !kontrakId ? 'bg-sky-50/70 font-semibold text-sky-800' : 'text-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                            <span>-- Tanpa Kontrak (Non-Kontraktual / UP / GU / Gaji) --</span>
                          </div>
                          {!kontrakId && <Check className="w-4 h-4 text-sky-600" />}
                        </div>

                        {filteredKontrakList.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500 italic">
                            Tidak ada data kontrak pekerjaan yang sesuai pencarian "{contractSearchQuery}".
                          </div>
                        ) : (
                          filteredKontrakList.map((k) => {
                            const isSelected = k.id === kontrakId;
                            return (
                              <div
                                key={k.id}
                                onClick={() => {
                                  setKontrakId(k.id);
                                  setIsContractDropdownOpen(false);
                                }}
                                className={`p-2.5 text-xs hover:bg-sky-50/60 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-sky-50 border-l-4 border-sky-600 pl-2' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-0.5">
                                  <span className="font-mono font-bold text-sky-700 bg-sky-100/70 px-1.5 py-0.5 rounded text-[11px]">
                                    [{k.nomorKontrak}]
                                  </span>
                                  <span className="font-semibold text-emerald-700 text-[11px] shrink-0">
                                    {formatRupiah(k.nilaiKontrak)}
                                  </span>
                                </div>
                                <p className="font-semibold text-slate-800 line-clamp-1">{k.uraian}</p>
                                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                                  <span>Penyedia: <strong className="text-slate-700">{k.namaPenyedia}</strong></span>
                                  {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Uraian Pekerjaan / Pencairan SPM *
              </label>
              <textarea
                required
                rows={2}
                value={uraianPekerjaan}
                onChange={(e) => setUraianPekerjaan(e.target.value)}
                placeholder="Rincian uraian keperluan pencairan dana SPM..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Progress Fisik (%)
                </label>
                {kontrakId && (
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Auto Update Kontrak
                  </span>
                )}
              </div>
              <input
                type="number"
                min={0}
                max={100}
                value={persentaseFisik}
                onChange={(e) => setPersentaseFisik(Number(e.target.value))}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {kontrakId ? (
                <p className="text-[10px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Otomatis memperbarui % fisik pada Data Kontrak yang terpilih.</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 mt-1">
                  Persentase capaian fisik pekerjaan saat pencairan SPM.
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Multi-row Rincian Belanja */}
          <div className="space-y-3 border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Rincian Objek Belanja SPM (Dapat Lebih dari Satu Bidang/Rekening)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Total Realisasi: <span className="font-extrabold text-sky-700">{formatRupiah(totalRealisasi)}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddRincianRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris Belanja</span>
              </button>
            </div>

            {rincianList.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center text-xs text-slate-500">
                Belum ada rincian belanja. Klik <strong>"Tambah Baris Belanja"</strong> di atas.
              </div>
            ) : (
              <div className="space-y-3">
                {rincianList.map((row, idx) => {
                  const filteredPrograms = programList.filter((p) => p.bidangId === row.bidangId);
                  const filteredKegiatans = kegiatanList.filter((k) => k.programId === row.programId);
                  const filteredSubKegiatans = subKegiatanList.filter((sk) => sk.kegiatanId === row.kegiatanId);
                  const filteredRekenings = rekeningList.filter(
                    (rk) => rk.subKegiatanId === row.subKegiatanId && rk.tahun === selectedYear
                  );

                  return (
                    <div
                      key={row.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 relative"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                        <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                          Rincian #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRincianRow(row.id)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Baris</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                        {/* Bidang */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Bidang</label>
                          <select
                            value={row.bidangId}
                            onChange={(e) => handleUpdateRincianRow(row.id, 'bidangId', e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                          >
                            {bidangList.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.nama}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Program */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Program</label>
                          <select
                            value={row.programId}
                            onChange={(e) => handleUpdateRincianRow(row.id, 'programId', e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                          >
                            {filteredPrograms.map((p) => (
                              <option key={p.id} value={p.id}>
                                [{p.kode}] {p.nama}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Kegiatan */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Kegiatan</label>
                          <select
                            value={row.kegiatanId}
                            onChange={(e) => handleUpdateRincianRow(row.id, 'kegiatanId', e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                          >
                            {filteredKegiatans.map((k) => (
                              <option key={k.id} value={k.id}>
                                [{k.kode}] {k.nama}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Sub Kegiatan */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Sub Kegiatan</label>
                          <select
                            value={row.subKegiatanId}
                            onChange={(e) => handleUpdateRincianRow(row.id, 'subKegiatanId', e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                          >
                            {filteredSubKegiatans.map((sk) => (
                              <option key={sk.id} value={sk.id}>
                                [{sk.kode}] {sk.nama}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Rekening */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Rekening Belanja</label>
                          <select
                            value={row.rekeningId}
                            onChange={(e) => handleUpdateRincianRow(row.id, 'rekeningId', e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                          >
                            {filteredRekenings.map((rk) => (
                              <option key={rk.id} value={rk.id}>
                                [{rk.kode}] {rk.nama} (Pagu: {formatRupiah(rk.pagu)})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Realisasi Rp */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nilai Realisasi (Rp) *</label>
                          <input
                            type="number"
                            min={0}
                            value={row.nilaiRealisasi}
                            onChange={(e) => handleUpdateRincianRow(row.id, 'nilaiRealisasi', Number(e.target.value))}
                            placeholder="0"
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-sky-800"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Tax Calculation */}
          <div className="space-y-3 border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Pemotongan Pajak SPM (Hitung Otomatis & Manual Override)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Potongan pajak langsung dihitung dari nilai realisasi
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoCalculateTax}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Kalkulasi Otomatis Tax</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">PPN (11%)</label>
                <input
                  type="number"
                  min={0}
                  value={pajak.ppn}
                  onChange={(e) => setPajak({ ...pajak, ppn: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">PPh 21</label>
                <input
                  type="number"
                  min={0}
                  value={pajak.pph21}
                  onChange={(e) => setPajak({ ...pajak, pph21: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">PPh 22</label>
                <input
                  type="number"
                  min={0}
                  value={pajak.pph22}
                  onChange={(e) => setPajak({ ...pajak, pph22: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">PPh 23</label>
                <input
                  type="number"
                  min={0}
                  value={pajak.pph23}
                  onChange={(e) => setPajak({ ...pajak, pph23: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">PPh Pasal 4(2)</label>
                <input
                  type="number"
                  min={0}
                  value={pajak.pphPasal4}
                  onChange={(e) => setPajak({ ...pajak, pphPasal4: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-900"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{spmToEdit ? 'Simpan Perubahan' : 'Simpan SPM Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
