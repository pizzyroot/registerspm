import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  FileCheck2,
  Briefcase,
  FileSearch,
  Layers,
  Receipt,
  FileSpreadsheet,
  Database,
  ArrowRightLeft,
  ChevronRight,
} from 'lucide-react';

import { RotateCcw } from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'spm'
  | 'pekerjaan'
  | 'kontrol_kontrak_spm'
  | 'jurnal'
  | 'pengembalian_belanja'
  | 'rekap_bidang'
  | 'rekap_rekening'
  | 'rekap_pajak'
  | 'master';

interface SidebarProps {
  activeTab?: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
  sidebarOpen: propSidebarOpen,
  setSidebarOpen: propSetSidebarOpen,
}) => {
  const {
    currentView,
    setCurrentView,
    sidebarOpen: ctxSidebarOpen,
    setSidebarOpen: ctxSetSidebarOpen,
    isAdmin,
  } = useApp();

  const activeTab = propActiveTab || (currentView as ActiveTab) || 'dashboard';
  const setActiveTab = propSetActiveTab || ((tab: ActiveTab) => setCurrentView(tab));
  const sidebarOpen = propSidebarOpen !== undefined ? propSidebarOpen : ctxSidebarOpen;
  const setSidebarOpen = propSetSidebarOpen || ctxSetSidebarOpen;
  const menuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Ringkasan & Statistik Belanja',
    },
    {
      id: 'spm' as ActiveTab,
      label: 'Register SPM',
      icon: FileCheck2,
      description: 'Input & Register SPM Baru',
    },
    {
      id: 'pekerjaan' as ActiveTab,
      label: 'Pekerjaan Belum Selesai',
      icon: Briefcase,
      description: 'Kontrol Kontrak & Deadline',
    },
    {
      id: 'kontrol_kontrak_spm' as ActiveTab,
      label: 'Kontrol Kontrak & SPM',
      icon: FileSearch,
      description: 'Pencarian Kontrak & Detail SPM',
    },
    {
      id: 'jurnal' as ActiveTab,
      label: 'Jurnal Belanja',
      icon: ArrowRightLeft,
      description: 'Pemindahan Realisasi Rekening',
    },
    {
      id: 'pengembalian_belanja' as ActiveTab,
      label: 'Pengembalian Belanja',
      icon: RotateCcw,
      description: 'Surat Tanda Setoran (STS)',
    },
    {
      id: 'rekap_bidang' as ActiveTab,
      label: 'Rekap per Bidang',
      icon: Layers,
      description: 'Laporan Hirarki Belanja',
    },
    {
      id: 'rekap_rekening' as ActiveTab,
      label: 'Rekap Rekening Belanja',
      icon: Receipt,
      description: 'Rincian Objek Belanja',
    },
    {
      id: 'rekap_pajak' as ActiveTab,
      label: 'Rekap Laporan Pajak',
      icon: FileSpreadsheet,
      description: 'PPN, PPh 21, 22, 23 & Pas 4',
    },
    {
      id: 'master' as ActiveTab,
      label: 'Master Data',
      icon: Database,
      description: 'Bidang, Sub, Pagu & User',
    },
  ].filter((item) => {
    if (item.id === 'master' && !isAdmin) return false;
    return true;
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-[57px] bottom-0 left-0 z-40 w-72 bg-slate-950 border-r border-slate-800/80 text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col justify-between p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Group 1: UTAMA */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-heading">
                MODUL UTAMA
              </div>
              {[
                {
                  id: 'dashboard' as ActiveTab,
                  label: 'Dashboard',
                  icon: LayoutDashboard,
                  description: 'Ringkasan & Statistik Belanja',
                },
                {
                  id: 'spm' as ActiveTab,
                  label: 'Register SPM',
                  icon: FileCheck2,
                  description: 'Input & Register SPM Baru',
                },
                {
                  id: 'pekerjaan' as ActiveTab,
                  label: 'Pekerjaan Fisik',
                  icon: Briefcase,
                  description: 'Kontrol Kontrak & Deadline',
                },
                {
                  id: 'kontrol_kontrak_spm' as ActiveTab,
                  label: 'Kontrol Kontrak & SPM',
                  icon: FileSearch,
                  description: 'Pencarian Kontrak & Detail SPM',
                },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group cursor-pointer border ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 font-extrabold border-amber-300 shadow-md shadow-amber-950/20'
                        : 'bg-slate-900/40 hover:bg-slate-900 hover:text-white text-slate-300 border-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-slate-950 font-bold' : 'text-slate-400 group-hover:text-amber-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className={`text-xs uppercase tracking-wide leading-tight truncate ${isActive ? 'font-black text-slate-950' : 'font-bold text-slate-200'}`}>
                          {item.label}
                        </div>
                        <div
                          className={`text-[10px] leading-tight truncate ${
                            isActive ? 'text-slate-900 font-bold' : 'text-slate-500 group-hover:text-slate-400'
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive
                          ? 'text-slate-950 font-bold opacity-100 translate-x-0.5'
                          : 'text-slate-600 opacity-0 group-hover:opacity-100'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Group 2: TRANSAKSI & JURNAL */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-heading">
                TRANSAKSI &amp; JURNAL
              </div>
              {[
                {
                  id: 'jurnal' as ActiveTab,
                  label: 'Jurnal Belanja',
                  icon: ArrowRightLeft,
                  description: 'Pemindahan Realisasi Rekening',
                },
                {
                  id: 'pengembalian_belanja' as ActiveTab,
                  label: 'Pengembalian STS',
                  icon: RotateCcw,
                  description: 'Setoran Pengembalian Uang',
                },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group cursor-pointer border ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 font-extrabold border-amber-300 shadow-md shadow-amber-950/20'
                        : 'bg-slate-900/40 hover:bg-slate-900 hover:text-white text-slate-300 border-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-slate-950 font-bold' : 'text-slate-400 group-hover:text-amber-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className={`text-xs uppercase tracking-wide leading-tight truncate ${isActive ? 'font-black text-slate-950' : 'font-bold text-slate-200'}`}>
                          {item.label}
                        </div>
                        <div
                          className={`text-[10px] leading-tight truncate ${
                            isActive ? 'text-slate-900 font-bold' : 'text-slate-500 group-hover:text-slate-400'
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive
                          ? 'text-slate-950 font-bold opacity-100 translate-x-0.5'
                          : 'text-slate-600 opacity-0 group-hover:opacity-100'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Group 3: LAPORAN & REKAPITULASI */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-heading">
                LAPORAN &amp; REKAPITULASI
              </div>
              {[
                {
                  id: 'rekap_bidang' as ActiveTab,
                  label: 'Rekap per Bidang',
                  icon: Layers,
                  description: 'Laporan Hirarki Belanja',
                },
                {
                  id: 'rekap_rekening' as ActiveTab,
                  label: 'Rekap Rekening',
                  icon: Receipt,
                  description: 'Rincian Objek Belanja',
                },
                {
                  id: 'rekap_pajak' as ActiveTab,
                  label: 'Laporan Pajak',
                  icon: FileSpreadsheet,
                  description: 'PPN, PPh 21, 22, 23 & Pas 4',
                },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group cursor-pointer border ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 font-extrabold border-amber-300 shadow-md shadow-amber-950/20'
                        : 'bg-slate-900/40 hover:bg-slate-900 hover:text-white text-slate-300 border-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-slate-950 font-bold' : 'text-slate-400 group-hover:text-amber-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className={`text-xs uppercase tracking-wide leading-tight truncate ${isActive ? 'font-black text-slate-950' : 'font-bold text-slate-200'}`}>
                          {item.label}
                        </div>
                        <div
                          className={`text-[10px] leading-tight truncate ${
                            isActive ? 'text-slate-900 font-bold' : 'text-slate-500 group-hover:text-slate-400'
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive
                          ? 'text-slate-950 font-bold opacity-100 translate-x-0.5'
                          : 'text-slate-600 opacity-0 group-hover:opacity-100'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Group 4: PENGATURAN */}
            {isAdmin && (
              <div className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-heading">
                  PENGATURAN MASTER
                </div>
                {[
                  {
                    id: 'master' as ActiveTab,
                    label: 'Master Data & GAS',
                    icon: Database,
                    description: 'Pagu, Sub, User & Integrasi',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group cursor-pointer border ${
                        isActive
                          ? 'bg-amber-400 text-slate-950 font-extrabold border-amber-300 shadow-md shadow-amber-950/20'
                          : 'bg-slate-900/40 hover:bg-slate-900 hover:text-white text-slate-300 border-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-slate-950 font-bold' : 'text-slate-400 group-hover:text-amber-400'
                          }`}
                        />
                        <div className="min-w-0">
                          <div className={`text-xs uppercase tracking-wide leading-tight truncate ${isActive ? 'font-black text-slate-950' : 'font-bold text-slate-200'}`}>
                            {item.label}
                          </div>
                          <div
                            className={`text-[10px] leading-tight truncate ${
                              isActive ? 'text-slate-900 font-bold' : 'text-slate-500 group-hover:text-slate-400'
                            }`}
                          >
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isActive
                            ? 'text-slate-950 font-bold opacity-100 translate-x-0.5'
                            : 'text-slate-600 opacity-0 group-hover:opacity-100'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Info Panel */}
          <div className="mt-6 p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs space-y-1">
            <div className="font-extrabold text-amber-400 uppercase tracking-wider text-[11px] font-heading">
              Aplikasi Keuangan APBD
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Database: <span className="text-emerald-400 font-bold">Google Apps Script Web App</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Registrasi SPM &amp; Realisasi APBD
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
