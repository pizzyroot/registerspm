import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { RegisterSpmView } from './components/spm/RegisterSpmView';
import { PekerjaanBelumSelesaiView } from './components/pekerjaan/PekerjaanBelumSelesaiView';
import { KontrolKontrakSpmView } from './components/kontrak/KontrolKontrakSpmView';
import { JurnalBelanjaView } from './components/jurnal/JurnalBelanjaView';
import { PengembalianBelanjaView } from './components/pengembalian/PengembalianBelanjaView';
import { RekapBidangView } from './components/rekap/RekapBidangView';
import { RekapRekeningView } from './components/rekap/RekapRekeningView';
import { RekapPajakView } from './components/rekap/RekapPajakView';
import { MasterDataView } from './components/master/MasterDataView';

const MainContent: React.FC = () => {
  const { currentView, user, isLoggedIn, isAdmin, isLoginModalOpen, setIsLoginModalOpen } = useApp();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'spm':
      case 'register_spm':
        return <RegisterSpmView />;
      case 'pekerjaan':
      case 'pekerjaan_belum_selesai':
        return <PekerjaanBelumSelesaiView />;
      case 'kontrol_kontrak_spm':
      case 'kontrak_spm':
        return <KontrolKontrakSpmView />;
      case 'jurnal':
      case 'jurnal_belanja':
        return <JurnalBelanjaView />;
      case 'pengembalian':
      case 'pengembalian_belanja':
        return <PengembalianBelanjaView />;
      case 'rekap_bidang':
        return <RekapBidangView />;
      case 'rekap_rekening':
        return <RekapRekeningView />;
      case 'rekap_pajak':
        return <RekapPajakView />;
      case 'master':
      case 'master_bidang':
      case 'master_program':
      case 'master_kegiatan':
      case 'master_subkegiatan':
      case 'master_rekening':
      case 'master_kontrak':
      case 'master_user':
      case 'master_spreadsheet':
        return isAdmin ? <MasterDataView /> : <DashboardView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-amber-400 selection:text-slate-950">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 lg:pl-72 overflow-y-auto min-w-0 w-full">
          <main className="p-3 sm:p-5 lg:p-6 max-w-full mx-auto w-full min-w-0">
            {renderView()}
          </main>
        </div>
      </div>

      {(!isLoggedIn || isLoginModalOpen) && (
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
