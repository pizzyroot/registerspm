import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TahunAnggaran } from '../types';
import {
  FileSpreadsheet,
  UploadCloud,
  DownloadCloud,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface NavbarProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  sidebarOpen: propSidebarOpen,
  setSidebarOpen: propSetSidebarOpen,
}) => {
  const {
    sidebarOpen: ctxSidebarOpen,
    setSidebarOpen: ctxSetSidebarOpen,
    selectedYear,
    setSelectedYear,
    user,
    isAdmin,
    isLoggedIn,
    setIsLoginModalOpen,
    logout,
    syncWebToSpreadsheet,
    syncSpreadsheetToWeb,
    isSyncing,
    syncStatusMessage,
    gasConfig,
  } = useApp();

  const sidebarOpen = propSidebarOpen !== undefined ? propSidebarOpen : ctxSidebarOpen;
  const setSidebarOpen = propSetSidebarOpen || ctxSetSidebarOpen;

  const years: TahunAnggaran[] = ['2026', '2027', '2028', '2029', '2030'];
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [dismissedText, setDismissedText] = useState<string | null>(null);

  const isDismissed = Boolean(syncStatusMessage && syncStatusMessage.text === dismissedText);

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white shadow-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Executive Brand Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer border border-slate-800 shrink-0"
              title="Toggle Menu"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-md border border-amber-400/40 shrink-0 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <FileSpreadsheet className="w-5 h-5 relative z-10" />
              </div>
              <div className="hidden sm:block min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-extrabold tracking-tight text-white uppercase font-heading truncate">
                    REGISTER SPM <span className="text-amber-400">&amp;</span> REKAPITULASI BELANJA
                  </h1>
                  <span className="hidden xl:inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-300 bg-amber-950/80 border border-amber-700/50 rounded-md">
                    APBD
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium tracking-wide truncate">
                  Sistem Informasi Kontrol Realisasi &amp; Kontrak Keuangan
                </p>
              </div>
            </div>
          </div>

          {/* Right: Year Selector, Sync Actions & User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Year Selector Widget */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/70 rounded-xl px-3 py-1.5 shadow-xs">
              <span className="text-[10px] text-amber-400 font-black tracking-widest hidden md:inline uppercase">
                TAHUN:
              </span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value as TahunAnggaran)}
                className="bg-transparent text-xs sm:text-sm font-extrabold text-amber-400 focus:outline-none cursor-pointer tracking-wider font-mono"
              >
                {years.map((y) => (
                  <option key={y} value={y} className="bg-slate-900 text-amber-400 font-bold">
                    TA {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Sync Spreadsheet Buttons */}
            <div className="hidden md:flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => syncWebToSpreadsheet()}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer border border-emerald-300/50 whitespace-nowrap shrink-0"
                  title="Update data dari web ke Google Spreadsheet"
                >
                  {isSyncing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan Ke Spreadsheet</span>
                </button>
              )}

              <button
                onClick={() => syncSpreadsheetToWeb()}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer border border-amber-300/50 whitespace-nowrap shrink-0"
                title="Tarik data dari Google Spreadsheet ke Web"
              >
                {isSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <DownloadCloud className="w-3.5 h-3.5" />
                )}
                <span>Tarik Dari Spreadsheet</span>
              </button>
            </div>

            {/* Mobile Sync Button */}
            <button
              onClick={() => setShowSyncModal(true)}
              className="md:hidden p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Menu Sync Spreadsheet"
            >
              <DownloadCloud className="w-4 h-4 text-amber-400" />
            </button>

            {/* User Profile Pill & Login/Logout */}
            <div className="pl-2 border-l border-slate-800 flex items-center gap-2">
              {isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex flex-col items-end">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-200">{user.namaLengkap}</span>
                      {isAdmin ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-400 text-slate-950 shadow-xs">
                          ADMIN
                        </span>
                      ) : user?.role === 'guest' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-400 text-slate-950 shadow-xs">
                          GUEST
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-400 text-slate-950 shadow-xs">
                          USER SPM
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{user.jabatan}</span>
                  </div>

                  <button
                    onClick={logout}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 border border-rose-800/40 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0"
                    title="Keluar / Logout"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Login Role</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sync Status Notification Banner - Shifted right with lg:pl-80 so sidebar doesn't overlap */}
        {syncStatusMessage && !isDismissed && (
          <div
            className={`px-4 py-2.5 text-xs font-medium border-t transition-all shadow-md ${
              syncStatusMessage.type === 'success'
                ? 'bg-emerald-950/95 text-emerald-300 border-emerald-800/80'
                : syncStatusMessage.type === 'error'
                ? 'bg-rose-950/95 text-rose-300 border-rose-800/80'
                : 'bg-sky-950/95 text-sky-300 border-sky-800/80'
            }`}
          >
            <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3 lg:pl-80">
              <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
                {syncStatusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5 sm:mt-0" />
                ) : syncStatusMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5 sm:mt-0" />
                ) : (
                  <Loader2 className="w-4 h-4 shrink-0 animate-spin text-sky-400 mt-0.5 sm:mt-0" />
                )}
                <span className="flex-1 break-words leading-relaxed font-bold text-xs sm:text-sm tracking-wide">
                  {syncStatusMessage.text}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {gasConfig.lastSyncedAt && (
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                    Sync: {gasConfig.lastSyncedAt}
                  </span>
                )}
                <button
                  onClick={() => setDismissedText(syncStatusMessage.text)}
                  className="p-1 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Tutup Notifikasi"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 font-heading">Sinkronisasi Google Spreadsheet</h3>
              <button
                onClick={() => setShowSyncModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Pilih tindakan sinkronisasi dengan Google Spreadsheet backend:
            </p>

            <div className="space-y-2.5 pt-1">
              {isAdmin && (
                <button
                  onClick={() => {
                    syncWebToSpreadsheet();
                    setShowSyncModal(false);
                  }}
                  disabled={isSyncing}
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Simpan Data Ke Spreadsheet</span>
                </button>
              )}

              <button
                onClick={() => {
                  syncSpreadsheetToWeb();
                  setShowSyncModal(false);
                }}
                disabled={isSyncing}
                className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Tarik Data Dari Spreadsheet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
