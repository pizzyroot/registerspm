import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lock,
  User,
  FileSpreadsheet,
  ShieldAlert,
  ArrowRight,
  X,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface LoginModalProps {
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const { login, isLoggedIn, syncSpreadsheetToWeb, isSyncing } = useApp();
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [syncSuccessMsg, setSyncSuccessMsg] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-sync database users as soon as login modal appears
  useEffect(() => {
    let active = true;
    syncSpreadsheetToWeb().then((ok) => {
      if (active && ok) {
        setSyncSuccessMsg(true);
        setTimeout(() => {
          if (active) setSyncSuccessMsg(false);
        }, 3000);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const trimmedUsername = usernameInput.trim();

    // 1. Check local state first
    let success = login(trimmedUsername, passwordInput);

    // 2. If login fails, force sync from spreadsheet database to ensure new/updated accounts are loaded
    if (!success) {
      const synced = await syncSpreadsheetToWeb();
      if (synced) {
        success = login(trimmedUsername, passwordInput);
      }
    }

    if (!success) {
      setErrorMsg('Username atau password yang Anda masukkan salah.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-auto">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-sky-950 to-slate-900 p-6 sm:p-8 text-center relative border-b border-slate-800">
          {isLoggedIn && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 mb-3 shadow-inner">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-wide uppercase font-heading">
            REGISTER SPM <span className="text-amber-400">&</span> REKAPITULASI
          </h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Sistem Informasi Pengelolaan Belanja Daerah & Kontrak APBD
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-base font-extrabold text-slate-900">Masuk Portal Sistem</h2>
              <p className="text-xs text-slate-500">
                Masukkan akun kredensial Anda untuk melanjutkan
              </p>

              {/* Status synchronization info */}
              {isSyncing ? (
                <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 mt-1 text-[11px] font-semibold text-sky-700 bg-sky-50 rounded-lg border border-sky-200 w-full animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600 shrink-0" />
                  <span>Menyinkronkan akun user dari database...</span>
                </div>
              ) : syncSuccessMsg ? (
                <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 mt-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 w-full transition-all">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Data login pengguna terupdate dari database</span>
                </div>
              ) : null}
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2.5 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memeriksa Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
