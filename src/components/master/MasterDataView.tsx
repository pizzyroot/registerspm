import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bidang,
  Program,
  Kegiatan,
  SubKegiatan,
  RekeningPagu,
  User,
} from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { GOOGLE_APPS_SCRIPT_CODE } from '../../utils/gasScriptTemplate';
import {
  Database,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  UserCheck,
  FileSpreadsheet,
  UploadCloud,
  DownloadCloud,
  Copy,
  CheckCircle2,
  Lock,
  UserPlus,
  Shield,
  Users,
} from 'lucide-react';

type MasterTab =
  | 'bidang'
  | 'program'
  | 'kegiatan'
  | 'subkegiatan'
  | 'rekening'
  | 'user'
  | 'spreadsheet';

export const MasterDataView: React.FC = () => {
  const {
    selectedYear,
    isAdmin,
    bidangList,
    addBidang,
    updateBidang,
    deleteBidang,

    programList,
    addProgram,
    updateProgram,
    deleteProgram,

    kegiatanList,
    addKegiatan,
    updateKegiatan,
    deleteKegiatan,

    subKegiatanList,
    addSubKegiatan,
    updateSubKegiatan,
    deleteSubKegiatan,

    rekeningList,
    addRekening,
    updateRekening,
    deleteRekening,

    user,
    userList,
    addUser,
    updateUser,
    deleteUser,
    updateUserCredentials,

    gasConfig,
    updateGasConfig,
    syncWebToSpreadsheet,
    syncSpreadsheetToWeb,
    isSyncing,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<MasterTab>('bidang');

  // Modal dialog states
  const [modalType, setModalType] = useState<MasterTab | null>(null);

  // Form states for modals
  const [editId, setEditId] = useState<string | null>(null);

  // Bidang form
  const [bidangKode, setBidangKode] = useState('');
  const [bidangNama, setBidangNama] = useState('');

  // Program form
  const [progBidangId, setProgBidangId] = useState('');
  const [progKode, setProgKode] = useState('');
  const [progNama, setProgNama] = useState('');

  // Kegiatan form
  const [kegProgId, setKegProgId] = useState('');
  const [kegKode, setKegKode] = useState('');
  const [kegNama, setKegNama] = useState('');

  // Subkegiatan form
  const [subKegId, setSubKegId] = useState('');
  const [subKode, setSubKode] = useState('');
  const [subNama, setSubNama] = useState('');

  // Rekening form
  const [rekSubId, setRekSubId] = useState('');
  const [rekKode, setRekKode] = useState('');
  const [rekNama, setRekNama] = useState('');
  const [rekPagu, setRekPagu] = useState<number>(0);

  // User Manager Form & Modal
  const [usrUsername, setUsrUsername] = useState('');
  const [usrPassword, setUsrPassword] = useState('');
  const [usrNamaLengkap, setUsrNamaLengkap] = useState('');
  const [usrJabatan, setUsrJabatan] = useState('');
  const [usrRole, setUsrRole] = useState<'admin' | 'user' | 'guest'>('user');
  const [usrIsEdit, setUsrIsEdit] = useState(false);
  const [userMsg, setUserMsg] = useState('');

  // Script Copy Feedback
  const [copiedScript, setCopiedScript] = useState(false);

  // Handlers for modal open
  const openBidangModal = (b?: Bidang) => {
    if (b) {
      setEditId(b.id);
      setBidangKode(b.kode);
      setBidangNama(b.nama);
    } else {
      setEditId(null);
      setBidangKode(`1.01.0${bidangList.length + 1}`);
      setBidangNama('');
    }
    setModalType('bidang');
  };

  const openProgramModal = (p?: Program) => {
    if (p) {
      setEditId(p.id);
      setProgBidangId(p.bidangId);
      setProgKode(p.kode);
      setProgNama(p.nama);
    } else {
      setEditId(null);
      const defaultB = bidangList[0]?.id || '';
      setProgBidangId(defaultB);
      setProgKode('1.01.01.2.01');
      setProgNama('');
    }
    setModalType('program');
  };

  const openKegiatanModal = (k?: Kegiatan) => {
    if (k) {
      setEditId(k.id);
      setKegProgId(k.programId);
      setKegKode(k.kode);
      setKegNama(k.nama);
    } else {
      setEditId(null);
      const defaultP = programList[0]?.id || '';
      setKegProgId(defaultP);
      setKegKode('1.01.01.2.01.01');
      setKegNama('');
    }
    setModalType('kegiatan');
  };

  const openSubKegiatanModal = (sk?: SubKegiatan) => {
    if (sk) {
      setEditId(sk.id);
      setSubKegId(sk.kegiatanId);
      setSubKode(sk.kode);
      setSubNama(sk.nama);
    } else {
      setEditId(null);
      const defaultK = kegiatanList[0]?.id || '';
      setSubKegId(defaultK);
      setSubKode('1.01.01.2.01.01.01');
      setSubNama('');
    }
    setModalType('subkegiatan');
  };

  const openRekeningModal = (r?: RekeningPagu) => {
    if (r) {
      setEditId(r.id);
      setRekSubId(r.subKegiatanId);
      setRekKode(r.kode);
      setRekNama(r.nama);
      setRekPagu(r.pagu);
    } else {
      setEditId(null);
      const defaultSk = subKegiatanList[0]?.id || '';
      setRekSubId(defaultSk);
      setRekKode('5.1.02.01.01.0001');
      setRekNama('');
      setRekPagu(50000000);
    }
    setModalType('rekening');
  };

  // Submit Bidang
  const handleSaveBidang = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateBidang(editId, { kode: bidangKode, nama: bidangNama });
    } else {
      addBidang({ kode: bidangKode, nama: bidangNama });
    }
    setModalType(null);
  };

  // Submit Program
  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateProgram(editId, { bidangId: progBidangId, kode: progKode, nama: progNama });
    } else {
      addProgram({ bidangId: progBidangId, kode: progKode, nama: progNama });
    }
    setModalType(null);
  };

  // Submit Kegiatan
  const handleSaveKegiatan = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateKegiatan(editId, { programId: kegProgId, kode: kegKode, nama: kegNama });
    } else {
      addKegiatan({ programId: kegProgId, kode: kegKode, nama: kegNama });
    }
    setModalType(null);
  };

  // Submit Subkegiatan
  const handleSaveSubKegiatan = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateSubKegiatan(editId, { kegiatanId: subKegId, kode: subKode, nama: subNama });
    } else {
      addSubKegiatan({ kegiatanId: subKegId, kode: subKode, nama: subNama });
    }
    setModalType(null);
  };

  // Submit Rekening
  const handleSaveRekening = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateRekening(editId, {
        subKegiatanId: rekSubId,
        kode: rekKode,
        nama: rekNama,
        pagu: rekPagu,
        tahun: selectedYear,
      });
    } else {
      addRekening({
        subKegiatanId: rekSubId,
        kode: rekKode,
        nama: rekNama,
        pagu: rekPagu,
        tahun: selectedYear,
      });
    }
    setModalType(null);
  };

  const openUserModal = (u?: User) => {
    if (u) {
      setUsrUsername(u.username);
      setUsrPassword(u.passwordHash);
      setUsrNamaLengkap(u.namaLengkap);
      setUsrJabatan(u.jabatan);
      setUsrRole(u.role);
      setUsrIsEdit(true);
    } else {
      setUsrUsername('');
      setUsrPassword('');
      setUsrNamaLengkap('');
      setUsrJabatan('Staf Pengelola Keuangan');
      setUsrRole('user');
      setUsrIsEdit(false);
    }
    setModalType('user');
  };

  // User Save
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usrUsername.trim()) return;

    if (usrIsEdit) {
      updateUser(usrUsername.trim(), {
        passwordHash: usrPassword,
        namaLengkap: usrNamaLengkap.trim(),
        jabatan: usrJabatan.trim(),
        role: usrRole,
      });
      setUserMsg(`Data user "${usrUsername}" berhasil diperbarui!`);
    } else {
      addUser({
        username: usrUsername.trim(),
        passwordHash: usrPassword || 'user123',
        namaLengkap: usrNamaLengkap.trim() || usrUsername.trim(),
        jabatan: usrJabatan.trim() || 'Staf Keuangan',
        role: usrRole,
      });
      setUserMsg(`User baru "${usrUsername}" berhasil ditambahkan & disinkronkan!`);
    }
    setModalType(null);
    setTimeout(() => setUserMsg(''), 4000);
  };

  // Copy Apps Script Code
  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Database className="w-6 h-6 text-sky-600" />
              Pengelolaan Master Data & Integrasi Spreadsheet
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Input struktur bidang, program, kegiatan, subkegiatan, rekening & pagu, akun login, dan Apps Script.
            </p>
          </div>
          {isAdmin ? (
            <span className="self-start sm:self-center px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs rounded-full flex items-center gap-1.5 shrink-0">
              <UserCheck className="w-4 h-4 text-amber-600" />
              <span>Akses Full Admin Active</span>
            </span>
          ) : (
            <span className="self-start sm:self-center px-3 py-1 bg-sky-100 text-sky-900 border border-sky-300 font-extrabold text-xs rounded-full flex items-center gap-1.5 shrink-0">
              <Lock className="w-4 h-4 text-sky-600" />
              <span>Akses User (Read Only)</span>
            </span>
          )}
        </div>

        {!isAdmin && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl flex items-center gap-2 font-semibold">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Mode User Active: Anda dapat melihat seluruh Master Data, namun tombol Menambah, Mengedit, dan Menghapus dinonaktifkan.
            </span>
          </div>
        )}
      </div>

      {/* Sub Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/80 rounded-2xl overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('bidang')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'bidang'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          1. Data Bidang
        </button>

        <button
          onClick={() => setActiveSubTab('program')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'program'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          2. Data Program
        </button>

        <button
          onClick={() => setActiveSubTab('kegiatan')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'kegiatan'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          3. Data Kegiatan
        </button>

        <button
          onClick={() => setActiveSubTab('subkegiatan')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'subkegiatan'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          4. Data Sub Kegiatan
        </button>

        <button
          onClick={() => setActiveSubTab('rekening')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'rekening'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          5. Rekening & Pagu
        </button>

        <button
          onClick={() => setActiveSubTab('user')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'user'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          6. User Login
        </button>

        <button
          onClick={() => setActiveSubTab('spreadsheet')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'spreadsheet'
              ? 'bg-sky-700 text-white shadow-xs'
              : 'text-slate-700 hover:text-sky-800'
          }`}
        >
          7. Integrasi Spreadsheet
        </button>
      </div>

      {/* Sub Tab 1: DATA BIDANG */}
      {activeSubTab === 'bidang' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Master Data Bidang</h3>
              <p className="text-xs text-slate-500">Daftar unit bidang kerja pemohon APBD</p>
            </div>
            {isAdmin ? (
              <button
                onClick={() => openBidangModal()}
                className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Data Bidang</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-slate-100 text-slate-500 font-extrabold text-xs rounded-xl flex items-center gap-1.5 border border-slate-200">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Read-Only</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200 text-[11px]">
                  <th className="p-3 w-12 text-center">NO</th>
                  <th className="p-3 w-36">KODE</th>
                  <th className="p-3">NAMA BIDANG</th>
                  <th className="p-3 w-28 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {bidangList.map((b, idx) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-sky-900">{b.kode}</td>
                    <td className="p-3 font-semibold text-slate-800">{b.nama}</td>
                    <td className="p-3 text-center">
                      {isAdmin ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openBidangModal(b)}
                            className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg cursor-pointer"
                            title="Edit Bidang"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus bidang ${b.nama}?`)) deleteBidang(b.id);
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                            title="Hapus Bidang"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-400 font-bold border border-slate-200">
                          Read Only
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub Tab 2: DATA PROGRAM */}
      {activeSubTab === 'program' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Master Data Program</h3>
              <p className="text-xs text-slate-500">Daftar program kerja di masing-masing bidang</p>
            </div>
            {isAdmin ? (
              <button
                onClick={() => openProgramModal()}
                className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Data Program</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-slate-100 text-slate-500 font-extrabold text-xs rounded-xl flex items-center gap-1.5 border border-slate-200">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Read-Only</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200 text-[11px]">
                  <th className="p-3 w-12 text-center">NO</th>
                  <th className="p-3 w-48">BIDANG</th>
                  <th className="p-3 w-36">KODE</th>
                  <th className="p-3">PROGRAM</th>
                  <th className="p-3 w-28 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {programList.map((p, idx) => {
                  const bidang = bidangList.find((b) => b.id === p.bidangId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-700">{bidang?.nama || '-'}</td>
                      <td className="p-3 font-mono font-bold text-sky-900">{p.kode}</td>
                      <td className="p-3 font-semibold text-slate-900">{p.nama}</td>
                      <td className="p-3 text-center">
                        {isAdmin ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openProgramModal(p)}
                              className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus program ${p.nama}?`)) deleteProgram(p.id);
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-400 font-bold border border-slate-200">
                            Read Only
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub Tab 3: DATA KEGIATAN */}
      {activeSubTab === 'kegiatan' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Master Data Kegiatan</h3>
              <p className="text-xs text-slate-500">Daftar kegiatan APBD di bawah program</p>
            </div>
            {isAdmin ? (
              <button
                onClick={() => openKegiatanModal()}
                className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Data Kegiatan</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-slate-100 text-slate-500 font-extrabold text-xs rounded-xl flex items-center gap-1.5 border border-slate-200">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Read-Only</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200 text-[11px]">
                  <th className="p-3 w-12 text-center">NO</th>
                  <th className="p-3 w-48">PROGRAM</th>
                  <th className="p-3 w-36">KODE</th>
                  <th className="p-3">KEGIATAN</th>
                  <th className="p-3 w-28 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {kegiatanList.map((k, idx) => {
                  const prog = programList.find((p) => p.id === k.programId);
                  return (
                    <tr key={k.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-700">{prog?.nama || '-'}</td>
                      <td className="p-3 font-mono font-bold text-sky-900">{k.kode}</td>
                      <td className="p-3 font-semibold text-slate-900">{k.nama}</td>
                      <td className="p-3 text-center">
                        {isAdmin ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openKegiatanModal(k)}
                              className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus kegiatan ${k.nama}?`)) deleteKegiatan(k.id);
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-400 font-bold border border-slate-200">
                            Read Only
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub Tab 4: DATA SUB KEGIATAN */}
      {activeSubTab === 'subkegiatan' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Master Data Sub Kegiatan</h3>
              <p className="text-xs text-slate-500">Daftar sub kegiatan operasional daerah</p>
            </div>
            {isAdmin ? (
              <button
                onClick={() => openSubKegiatanModal()}
                className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Data Sub Kegiatan</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-slate-100 text-slate-500 font-extrabold text-xs rounded-xl flex items-center gap-1.5 border border-slate-200">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Read-Only</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200 text-[11px]">
                  <th className="p-3 w-12 text-center">NO</th>
                  <th className="p-3 w-48">KEGIATAN</th>
                  <th className="p-3 w-36">KODE</th>
                  <th className="p-3">SUB KEGIATAN</th>
                  <th className="p-3 w-28 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {subKegiatanList.map((sk, idx) => {
                  const keg = kegiatanList.find((k) => k.id === sk.kegiatanId);
                  return (
                    <tr key={sk.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-700">{keg?.nama || '-'}</td>
                      <td className="p-3 font-mono font-bold text-sky-900">{sk.kode}</td>
                      <td className="p-3 font-semibold text-slate-900">{sk.nama}</td>
                      <td className="p-3 text-center">
                        {isAdmin ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openSubKegiatanModal(sk)}
                              className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus subkegiatan ${sk.nama}?`)) deleteSubKegiatan(sk.id);
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-400 font-bold border border-slate-200">
                            Read Only
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub Tab 5: REKENING & PAGU */}
      {activeSubTab === 'rekening' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Master Data Rekening & Pagu Anggaran (TA {selectedYear})
              </h3>
              <p className="text-xs text-slate-500">Pagu anggaran per kode rekening objek belanja</p>
            </div>
            {isAdmin ? (
              <button
                onClick={() => openRekeningModal()}
                className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Rekening & Pagu</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-slate-100 text-slate-500 font-extrabold text-xs rounded-xl flex items-center gap-1.5 border border-slate-200">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Read-Only</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200 text-[11px]">
                  <th className="p-3 w-12 text-center">NO</th>
                  <th className="p-3 w-48">SUB KEGIATAN</th>
                  <th className="p-3 w-36">KODE</th>
                  <th className="p-3">NAMA REKENING BELANJA</th>
                  <th className="p-3 text-right w-36">PAGU ANGGARAN</th>
                  <th className="p-3 w-28 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {rekeningList.filter((r) => String(r.tahun) === String(selectedYear)).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-medium italic">
                      Belum ada data rekening & pagu anggaran untuk TA {selectedYear}. <br />
                      Silakan klik tombol <span className="font-bold text-sky-700">"Tambah Rekening & Pagu"</span> atau gunakan tombol <span className="font-bold text-amber-600">"Update dari Spreadsheet"</span> pada menu sinkronisasi.
                    </td>
                  </tr>
                ) : (
                  rekeningList
                    .filter((r) => String(r.tahun) === String(selectedYear))
                    .map((r, idx) => {
                      const sub = subKegiatanList.find((s) => String(s.id) === String(r.subKegiatanId));
                      return (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-700">{sub?.nama || '-'}</td>
                          <td className="p-3 font-mono font-bold text-sky-900">{r.kode}</td>
                          <td className="p-3 font-semibold text-slate-900">{r.nama}</td>
                          <td className="p-3 text-right font-extrabold text-sky-800">
                            {formatRupiah(r.pagu)}
                          </td>
                          <td className="p-3 text-center">
                            {isAdmin ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => openRekeningModal(r)}
                                  className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg cursor-pointer"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus rekening ${r.nama}?`)) deleteRekening(r.id);
                                  }}
                                  className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-400 font-bold border border-slate-200">
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
        </div>
      )}

      {/* Sub Tab 6: USER LOGIN MANAGER */}
      {activeSubTab === 'user' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-sky-50 text-sky-700 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Database User & Hak Akses Login</h3>
                <p className="text-xs text-slate-500">
                  Kelola daftar akun pengguna yang tersimpan di database web dan Google Spreadsheet (Sheet 'user')
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => openUserModal()}
                className="px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah User Baru</span>
              </button>
            )}
          </div>

          {!isAdmin && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl flex items-start gap-2.5 font-medium">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Akses Dibatasi:</strong> Fitur penambahan dan pengubahan pengguna hanya dapat diakses oleh akun <strong>Administrator</strong>.
              </div>
            </div>
          )}

          {userMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{userMsg}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200 text-[11px]">
                  <th className="p-3 w-12 text-center">NO</th>
                  <th className="p-3 w-36">USERNAME</th>
                  <th className="p-3">NAMA LENGKAP</th>
                  <th className="p-3">JABATAN</th>
                  <th className="p-3 w-32 text-center">HAK AKSES</th>
                  <th className="p-3 w-28 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {userList.map((u, idx) => (
                  <tr key={u.username} className="hover:bg-slate-50">
                    <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-sky-900">
                      <div className="flex items-center gap-1.5">
                        <span>{u.username}</span>
                        {u.username === user.username && (
                          <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-extrabold rounded-md">
                            (Anda)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{u.namaLengkap || '-'}</td>
                    <td className="p-3 text-slate-700">{u.jabatan || '-'}</td>
                    <td className="p-3 text-center">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Shield className="w-3 h-3" />
                          <span>Admin</span>
                        </span>
                      ) : u.role === 'guest' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          <UserCheck className="w-3 h-3" />
                          <span>Guest</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                          <UserCheck className="w-3 h-3" />
                          <span>User SPM</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {isAdmin ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openUserModal(u)}
                            className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {u.username.toLowerCase() !== 'admin' && (
                            <button
                              onClick={() => {
                                if (confirm(`Hapus user "${u.username}"?`)) deleteUser(u.username);
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                              title="Hapus User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-400 font-bold border border-slate-200">
                          Read Only
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub Tab 7: GOOGLE SPREADSHEET INTEGRATION & APPS SCRIPT CODE */}
      {activeSubTab === 'spreadsheet' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Konfigurasi Apps Script & API Google Spreadsheet
                </h3>
                <p className="text-xs text-slate-500">
                  Hubungkan web aplikasi ini dengan Google Spreadsheet melalui Google Apps Script Web App Endpoint.
                </p>
              </div>
            </div>

            {/* Web App URL Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Google Apps Script Web App URL:
                </label>
                <button
                  type="button"
                  onClick={() =>
                    updateGasConfig({
                      webAppUrl:
                        'https://script.google.com/macros/s/AKfycbzwodyXrF4eqzT7yx2y0Wu4Rtqu_xqxHadifIKFcFpEMAOA_2R-Dk7hXSfxSp1xUqNm/exec',
                    })
                  }
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  Isi Ulang URL Default
                </button>
              </div>
              <div className="relative">
                <input
                  type="url"
                  value={
                    gasConfig.webAppUrl ||
                    'https://script.google.com/macros/s/AKfycbzwodyXrF4eqzT7yx2y0Wu4Rtqu_xqxHadifIKFcFpEMAOA_2R-Dk7hXSfxSp1xUqNm/exec'
                  }
                  onChange={(e) => updateGasConfig({ webAppUrl: e.target.value })}
                  placeholder="https://script.google.com/macros/s/AKfycbzwodyXrF4eqzT7yx2y0Wu4Rtqu_xqxHadifIKFcFpEMAOA_2R-Dk7hXSfxSp1xUqNm/exec"
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                />
              </div>
              <p className="text-[11px] text-emerald-800 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/80 font-medium leading-relaxed">
                <strong>Status Terpasang:</strong> Link Web App Google Apps Script terisi otomatis (<code className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-emerald-300">https://script.google.com/macros/s/AKfycbzwody.../exec</code>). Data otomatis ditarik dari Google Spreadsheet setiap kali membuka halaman login atau aplikasi.
              </p>
            </div>

            {/* Manual Sync Action Buttons */}
            <div className="flex items-center flex-wrap gap-3 pt-2">
              <button
                onClick={() => syncWebToSpreadsheet(undefined, true)}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Update Data dari Web ke Spreadsheet</span>
              </button>

              <button
                onClick={() => syncSpreadsheetToWeb(true)}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Update Data dari Spreadsheet Google</span>
              </button>
            </div>
          </div>

          {/* Google Apps Script Backend Code Box */}
          <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 space-y-4 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-sm text-sky-400">Kode Google Apps Script Backend (.gs)</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Salin seluruh kode di bawah ini lalu Paste di Google Apps Script editor spreadsheet Anda.
                </p>
              </div>
              <button
                onClick={handleCopyScript}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {copiedScript ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedScript ? 'Tersalin!' : 'Copy Script (.gs)'}</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                readOnly
                rows={16}
                value={GOOGLE_APPS_SCRIPT_CODE}
                className="w-full p-4 bg-slate-950 text-slate-300 text-xs font-mono border border-slate-800 rounded-2xl focus:outline-none selection:bg-sky-700"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modals for Master Data Forms */}
      {/* Bidang Modal */}
      {modalType === 'bidang' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editId ? 'Edit Data Bidang' : 'Tambah Data Bidang Baru'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBidang} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Bidang *</label>
                <input
                  type="text"
                  required
                  value={bidangKode}
                  onChange={(e) => setBidangKode(e.target.value)}
                  placeholder="Contoh: 1.01.01"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Bidang *</label>
                <input
                  type="text"
                  required
                  value={bidangNama}
                  onChange={(e) => setBidangNama(e.target.value)}
                  placeholder="Contoh: Sekretariat"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-700 text-white font-bold rounded-xl flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Program Modal */}
      {modalType === 'program' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editId ? 'Edit Data Program' : 'Tambah Data Program Baru'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Bidang *</label>
                <select
                  value={progBidangId}
                  onChange={(e) => setProgBidangId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold cursor-pointer"
                >
                  {bidangList.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.kode}] {b.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Program *</label>
                <input
                  type="text"
                  required
                  value={progKode}
                  onChange={(e) => setProgKode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Program *</label>
                <input
                  type="text"
                  required
                  value={progNama}
                  onChange={(e) => setProgNama(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-700 text-white font-bold rounded-xl flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kegiatan Modal */}
      {modalType === 'kegiatan' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editId ? 'Edit Data Kegiatan' : 'Tambah Data Kegiatan Baru'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKegiatan} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Program *</label>
                <select
                  value={kegProgId}
                  onChange={(e) => setKegProgId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold cursor-pointer"
                >
                  {programList.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.kode}] {p.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Kegiatan *</label>
                <input
                  type="text"
                  required
                  value={kegKode}
                  onChange={(e) => setKegKode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kegiatan *</label>
                <input
                  type="text"
                  required
                  value={kegNama}
                  onChange={(e) => setKegNama(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-700 text-white font-bold rounded-xl flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SubKegiatan Modal */}
      {modalType === 'subkegiatan' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editId ? 'Edit Data Sub Kegiatan' : 'Tambah Data Sub Kegiatan Baru'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubKegiatan} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Kegiatan *</label>
                <select
                  value={subKegId}
                  onChange={(e) => setSubKegId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold cursor-pointer"
                >
                  {kegiatanList.map((k) => (
                    <option key={k.id} value={k.id}>
                      [{k.kode}] {k.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Sub Kegiatan *</label>
                <input
                  type="text"
                  required
                  value={subKode}
                  onChange={(e) => setSubKode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Sub Kegiatan *</label>
                <input
                  type="text"
                  required
                  value={subNama}
                  onChange={(e) => setSubNama(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-700 text-white font-bold rounded-xl flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rekening Modal */}
      {modalType === 'rekening' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editId ? 'Edit Rekening & Pagu' : 'Tambah Rekening & Pagu Baru'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRekening} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Sub Kegiatan *</label>
                <select
                  value={rekSubId}
                  onChange={(e) => setRekSubId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold cursor-pointer"
                >
                  {subKegiatanList.map((sk) => (
                    <option key={sk.id} value={sk.id}>
                      [{sk.kode}] {sk.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Rekening *</label>
                <input
                  type="text"
                  required
                  value={rekKode}
                  onChange={(e) => setRekKode(e.target.value)}
                  placeholder="Contoh: 5.1.02.01.01.0024"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Rekening Belanja *</label>
                <input
                  type="text"
                  required
                  value={rekNama}
                  onChange={(e) => setRekNama(e.target.value)}
                  placeholder="Contoh: Belanja Cetak dan Penggandaan"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pagu Anggaran (Rp) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={rekPagu}
                  onChange={(e) => setRekPagu(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-sky-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-700 text-white font-bold rounded-xl flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Modal */}
      {modalType === 'user' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-sky-700" />
                <h3 className="font-bold text-sm text-slate-900">
                  {usrIsEdit ? `Edit User "${usrUsername}"` : 'Tambah User Baru'}
                </h3>
              </div>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username Login *</label>
                <input
                  type="text"
                  required
                  disabled={usrIsEdit}
                  value={usrUsername}
                  onChange={(e) => setUsrUsername(e.target.value)}
                  placeholder="Contoh: user_bendahara"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password * {usrIsEdit && '(Isi untuk mengubah password)'}
                </label>
                <input
                  type="text"
                  required={!usrIsEdit}
                  value={usrPassword}
                  onChange={(e) => setUsrPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={usrNamaLengkap}
                  onChange={(e) => setUsrNamaLengkap(e.target.value)}
                  placeholder="Contoh: Ahmad Subagyo, S.E."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan *</label>
                <input
                  type="text"
                  required
                  value={usrJabatan}
                  onChange={(e) => setUsrJabatan(e.target.value)}
                  placeholder="Contoh: Bendahara Pengeluaran"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hak Akses / Role *</label>
                <select
                  value={usrRole}
                  onChange={(e) => setUsrRole(e.target.value as 'admin' | 'user' | 'guest')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="user">User SPM (Bisa Tambah/Edit SPM & Kontrak, Tanpa Master Data)</option>
                  <option value="admin">Administrator (Akses Penuh Input, Edit, Delete, Master Data & Push Spreadsheet)</option>
                  <option value="guest">Guest / Tamu (Hanya Bisa Melihat Data, Tanpa Master Data)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
