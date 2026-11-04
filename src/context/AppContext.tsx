import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  TahunAnggaran,
  User,
  Bidang,
  Program,
  Kegiatan,
  SubKegiatan,
  RekeningPagu,
  KontrakPekerjaan,
  RegisterSpm,
  JurnalBelanja,
  PengembalianBelanja,
  GasConfig,
} from '../types';
import {
  initialUser,
  initialRegularUser,
  initialGuestUser,
  initialUserList,
  initialBidang,
  initialProgram,
  initialKegiatan,
  initialSubKegiatan,
  initialRekening,
  initialKontrak,
  initialSpm,
  initialJurnalBelanja,
  initialPengembalianBelanja,
} from '../data/initialData';
import { normalizeDateString, formatDateDDMMYYYY } from '../utils/formatters';

interface AppContextType {
  currentView: string;
  setCurrentView: (view: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;

  selectedYear: TahunAnggaran;
  setSelectedYear: (year: TahunAnggaran) => void;
  user: User;
  userList: User[];
  addUser: (newUser: User) => void;
  updateUser: (username: string, updated: Partial<User>) => void;
  deleteUser: (username: string) => void;
  isAdmin: boolean;
  isGuest: boolean;
  canEdit: boolean;
  isLoggedIn: boolean;
  login: (u: string, p: string) => boolean;
  loginAs: (role: 'admin' | 'user' | 'guest') => void;
  logout: () => void;
  updateUserCredentials: (newUsername: string, newPassword: string) => void;

  // Master Data
  bidangList: Bidang[];
  addBidang: (item: Omit<Bidang, 'id'>) => void;
  updateBidang: (id: string, item: Omit<Bidang, 'id'>) => void;
  deleteBidang: (id: string) => void;

  programList: Program[];
  addProgram: (item: Omit<Program, 'id'>) => void;
  updateProgram: (id: string, item: Omit<Program, 'id'>) => void;
  deleteProgram: (id: string) => void;

  kegiatanList: Kegiatan[];
  addKegiatan: (item: Omit<Kegiatan, 'id'>) => void;
  updateKegiatan: (id: string, item: Omit<Kegiatan, 'id'>) => void;
  deleteKegiatan: (id: string) => void;

  subKegiatanList: SubKegiatan[];
  addSubKegiatan: (item: Omit<SubKegiatan, 'id'>) => void;
  updateSubKegiatan: (id: string, item: Omit<SubKegiatan, 'id'>) => void;
  deleteSubKegiatan: (id: string) => void;

  rekeningList: RekeningPagu[];
  addRekening: (item: Omit<RekeningPagu, 'id'>) => void;
  updateRekening: (id: string, item: Omit<RekeningPagu, 'id'>) => void;
  deleteRekening: (id: string) => void;

  kontrakList: KontrakPekerjaan[];
  addKontrak: (item: Omit<KontrakPekerjaan, 'id'>) => void;
  updateKontrak: (id: string, item: Omit<KontrakPekerjaan, 'id'>) => void;
  deleteKontrak: (id: string) => void;

  spmList: RegisterSpm[];
  addSpm: (item: Omit<RegisterSpm, 'id'>) => void;
  updateSpm: (id: string, item: Omit<RegisterSpm, 'id'>) => void;
  deleteSpm: (id: string) => void;

  jurnalBelanjaList: JurnalBelanja[];
  addJurnalBelanja: (item: Omit<JurnalBelanja, 'id'>) => void;
  updateJurnalBelanja: (id: string, item: Omit<JurnalBelanja, 'id'>) => void;
  deleteJurnalBelanja: (id: string) => void;

  pengembalianBelanjaList: PengembalianBelanja[];
  addPengembalianBelanja: (item: Omit<PengembalianBelanja, 'id'>) => void;
  updatePengembalianBelanja: (id: string, item: Omit<PengembalianBelanja, 'id'>) => void;
  deletePengembalianBelanja: (id: string) => void;

  // GAS Sync
  gasConfig: GasConfig;
  updateGasConfig: (config: Partial<GasConfig>) => void;
  isSyncing: boolean;
  syncStatusMessage: { type: 'success' | 'error' | 'info'; text: string } | null;
  syncWebToSpreadsheet: (customData?: any, isManual?: boolean) => Promise<boolean>;
  syncSpreadsheetToWeb: (isManual?: boolean) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'REG_SPM_APP_DATA_V1';
const DEFAULT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzwodyXrF4eqzT7yx2y0Wu4Rtqu_xqxHadifIKFcFpEMAOA_2R-Dk7hXSfxSp1xUqNm/exec';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const [selectedYear, setSelectedYear] = useState<TahunAnggaran>('2026');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('REG_SPM_AUTH') === 'true';
  });

  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('REG_SPM_USER');
    return saved ? JSON.parse(saved) : initialUser;
  });

  const [userList, setUserList] = useState<User[]>(() => {
    const saved = localStorage.getItem('REG_SPM_USER_LIST');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return initialUserList;
  });

  const [bidangList, setBidangList] = useState<Bidang[]>(initialBidang);
  const [programList, setProgramList] = useState<Program[]>(initialProgram);
  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>(initialKegiatan);
  const [subKegiatanList, setSubKegiatanList] = useState<SubKegiatan[]>(initialSubKegiatan);
  const [rekeningList, setRekeningList] = useState<RekeningPagu[]>(initialRekening);
  const [kontrakList, setKontrakList] = useState<KontrakPekerjaan[]>(initialKontrak);
  const [spmList, setSpmList] = useState<RegisterSpm[]>(initialSpm);
  const [jurnalBelanjaList, setJurnalBelanjaList] = useState<JurnalBelanja[]>(initialJurnalBelanja);
  const [pengembalianBelanjaList, setPengembalianBelanjaList] = useState<PengembalianBelanja[]>(initialPengembalianBelanja);

  const [gasConfig, setGasConfig] = useState<GasConfig>({
    webAppUrl: DEFAULT_WEB_APP_URL,
    autoSync: true,
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Load from local storage on init
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const isOldSample =
          parsed.spmList?.some((s: any) => s.id === 'SPM1') ||
          parsed.bidangList?.some((b: any) => b.id === 'B1');

        if (isOldSample) {
          setBidangList([]);
          setProgramList([]);
          setKegiatanList([]);
          setSubKegiatanList([]);
          setRekeningList([]);
          setKontrakList([]);
          setSpmList([]);
          setJurnalBelanjaList([]);
          setPengembalianBelanjaList([]);
        } else {
          if (parsed.bidangList) setBidangList(parsed.bidangList);
          if (parsed.programList) setProgramList(parsed.programList);
          if (parsed.kegiatanList) setKegiatanList(parsed.kegiatanList);
          if (parsed.subKegiatanList) setSubKegiatanList(parsed.subKegiatanList);
          if (parsed.rekeningList) setRekeningList(parsed.rekeningList);
          if (parsed.kontrakList) setKontrakList(parsed.kontrakList);
          if (parsed.spmList) setSpmList(parsed.spmList);
          if (parsed.jurnalBelanjaList) setJurnalBelanjaList(parsed.jurnalBelanjaList);
          if (parsed.pengembalianBelanjaList) setPengembalianBelanjaList(parsed.pengembalianBelanjaList);
        }

        if (Array.isArray(parsed.userList) && parsed.userList.length > 0) {
          setUserList(parsed.userList);
        }
        if (parsed.gasConfig) {
          const storedUrl = parsed.gasConfig.webAppUrl;
          const isOldLegacyUrl = storedUrl && storedUrl.includes('AKfycbyuEEcLIvB1vFqSWDp');
          const isInvalidOrEmpty = !storedUrl || !storedUrl.trim() || isOldLegacyUrl;
          setGasConfig({
            webAppUrl: isInvalidOrEmpty ? DEFAULT_WEB_APP_URL : storedUrl,
            autoSync: parsed.gasConfig.autoSync ?? true,
            lastSyncedAt: parsed.gasConfig.lastSyncedAt,
          });
        }
      }
    } catch (e) {
      console.error('Failed to parse localStorage data', e);
    }

    // Auto sync from spreadsheet database on initial load if URL exists
    syncSpreadsheetToWeb(false);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    const dataToSave = {
      bidangList,
      programList,
      kegiatanList,
      subKegiatanList,
      rekeningList,
      kontrakList,
      spmList,
      jurnalBelanjaList,
      pengembalianBelanjaList,
      userList,
      gasConfig,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    localStorage.setItem('REG_SPM_USER_LIST', JSON.stringify(userList));
  }, [
    bidangList,
    programList,
    kegiatanList,
    subKegiatanList,
    rekeningList,
    kontrakList,
    spmList,
    jurnalBelanjaList,
    pengembalianBelanjaList,
    userList,
    gasConfig,
  ]);

  // 30-Minute Inactivity Auto-Logout & Refresh Effect
  useEffect(() => {
    if (!isLoggedIn) return;

    const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 Menit
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetInactivityTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsLoggedIn(false);
        setIsLoginModalOpen(true);
        localStorage.removeItem('REG_SPM_AUTH');
        localStorage.removeItem('REG_SPM_USER');
        window.location.reload();
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, resetInactivityTimer));

    resetInactivityTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((evt) => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, [isLoggedIn]);

  const isAdmin = user?.role === 'admin';
  const isGuest = user?.role === 'guest';
  const canEdit = isLoggedIn && user?.role !== 'guest';

  // Auth functions
  const login = (u: string, p: string) => {
    const trimmedU = u.trim().toLowerCase();

    // 1. Check against userList dynamically
    const matchedAccount = userList.find(
      (acc) => acc.username.trim().toLowerCase() === trimmedU && acc.passwordHash === p
    );

    if (matchedAccount) {
      setUser(matchedAccount);
      setIsLoggedIn(true);
      setIsLoginModalOpen(false);
      localStorage.setItem('REG_SPM_AUTH', 'true');
      localStorage.setItem('REG_SPM_USER', JSON.stringify(matchedAccount));
      return true;
    }

    // 2. Check Admin default fallback
    if (
      (trimmedU === 'admin' && p === 'admin123') ||
      (u === user.username && p === user.passwordHash && user.role === 'admin')
    ) {
      const adminAcc: User = {
        ...initialUser,
        username: u,
        passwordHash: p || user.passwordHash,
      };
      setUser(adminAcc);
      setIsLoggedIn(true);
      setIsLoginModalOpen(false);
      localStorage.setItem('REG_SPM_AUTH', 'true');
      localStorage.setItem('REG_SPM_USER', JSON.stringify(adminAcc));
      return true;
    }

    // 3. Check User SPM default fallback
    if (
      (trimmedU === 'user' && p === 'user123') ||
      (u === user.username && p === user.passwordHash && user.role === 'user')
    ) {
      const regularUserAcc: User = {
        ...initialRegularUser,
        username: u,
      };
      setUser(regularUserAcc);
      setIsLoggedIn(true);
      setIsLoginModalOpen(false);
      localStorage.setItem('REG_SPM_AUTH', 'true');
      localStorage.setItem('REG_SPM_USER', JSON.stringify(regularUserAcc));
      return true;
    }

    // 4. Check Guest / Tamu default fallback
    if (
      (trimmedU === 'guest' || trimmedU === 'tamu') &&
      (p === 'guest123' || p === 'user123' || p === 'guest' || p === '')
    ) {
      const guestUserAcc: User = {
        ...initialGuestUser,
        username: u,
      };
      setUser(guestUserAcc);
      setIsLoggedIn(true);
      setIsLoginModalOpen(false);
      localStorage.setItem('REG_SPM_AUTH', 'true');
      localStorage.setItem('REG_SPM_USER', JSON.stringify(guestUserAcc));
      return true;
    }

    return false;
  };

  const loginAs = (role: 'admin' | 'user' | 'guest') => {
    let selectedAccount = initialUser;
    if (role === 'user') selectedAccount = initialRegularUser;
    if (role === 'guest') selectedAccount = initialGuestUser;

    setUser(selectedAccount);
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
    localStorage.setItem('REG_SPM_AUTH', 'true');
    localStorage.setItem('REG_SPM_USER', JSON.stringify(selectedAccount));
  };

  const logout = () => {
    setIsLoggedIn(false);
    setIsLoginModalOpen(true);
    localStorage.removeItem('REG_SPM_AUTH');
    localStorage.removeItem('REG_SPM_USER');
  };

  const updateUserCredentials = (newUsername: string, newPassword: string) => {
    const updated: User = { ...user, username: newUsername, passwordHash: newPassword || user.passwordHash, role: user.role || 'admin' };
    setUser(updated);
    localStorage.setItem('REG_SPM_USER', JSON.stringify(updated));

    // Also update in userList
    updateUser(user.username, { username: newUsername, passwordHash: newPassword || user.passwordHash });
  };

  // User CRUD Functions
  const addUser = (newUser: User) => {
    const existingIndex = userList.findIndex(
      (u) => u.username.trim().toLowerCase() === newUser.username.trim().toLowerCase()
    );
    let newList: User[];
    if (existingIndex >= 0) {
      newList = userList.map((u, idx) => (idx === existingIndex ? newUser : u));
    } else {
      newList = [...userList, newUser];
    }
    setUserList(newList);
    localStorage.setItem('REG_SPM_USER_LIST', JSON.stringify(newList));
    triggerAutoSync({ userList: newList });
  };

  const updateUser = (targetUsername: string, updatedFields: Partial<User>) => {
    const newList = userList.map((u) => {
      if (u.username.trim().toLowerCase() === targetUsername.trim().toLowerCase()) {
        return { ...u, ...updatedFields };
      }
      return u;
    });
    setUserList(newList);
    localStorage.setItem('REG_SPM_USER_LIST', JSON.stringify(newList));

    if (user.username.trim().toLowerCase() === targetUsername.trim().toLowerCase()) {
      const updatedCurrentUser = { ...user, ...updatedFields };
      setUser(updatedCurrentUser);
      localStorage.setItem('REG_SPM_USER', JSON.stringify(updatedCurrentUser));
    }
    triggerAutoSync({ userList: newList });
  };

  const deleteUser = (targetUsername: string) => {
    if (targetUsername.trim().toLowerCase() === 'admin') {
      alert('User "admin" utama tidak dapat dihapus!');
      return;
    }
    const newList = userList.filter((u) => u.username.trim().toLowerCase() !== targetUsername.trim().toLowerCase());
    setUserList(newList);
    localStorage.setItem('REG_SPM_USER_LIST', JSON.stringify(newList));
    triggerAutoSync({ userList: newList });
  };

  // Helper ID generator
  const genId = (prefix: string) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // Sync Web -> Google Spreadsheet
  const syncWebToSpreadsheet = async (
    customData?: {
      bidangList?: Bidang[];
      programList?: Program[];
      kegiatanList?: Kegiatan[];
      subKegiatanList?: SubKegiatan[];
      rekeningList?: RekeningPagu[];
      kontrakList?: KontrakPekerjaan[];
      spmList?: RegisterSpm[];
      jurnalBelanjaList?: JurnalBelanja[];
      pengembalianBelanjaList?: PengembalianBelanja[];
      userList?: User[];
    },
    isManual = false
  ): Promise<boolean> => {
    const cleanUrl = (gasConfig.webAppUrl && gasConfig.webAppUrl.trim()) ? gasConfig.webAppUrl.trim() : DEFAULT_WEB_APP_URL;

    if (!cleanUrl) {
      if (isManual) {
        setSyncStatusMessage({
          type: 'error',
          text: 'URL Apps Script belum diisi. Masukkan Google Apps Script Web App URL di menu Master Data > Integrasi Spreadsheet.',
        });
      }
      setIsSyncing(false);
      return false;
    }

    setIsSyncing(true);
    setSyncStatusMessage({ type: 'info', text: 'Mengirim data ke Google Spreadsheet...' });

    try {
      const payload = {
        action: 'sync_all',
        data: {
          bidang: customData?.bidangList ?? bidangList,
          program: customData?.programList ?? programList,
          kegiatan: customData?.kegiatanList ?? kegiatanList,
          subkegiatan: customData?.subKegiatanList ?? subKegiatanList,
          rekening: customData?.rekeningList ?? rekeningList,
          kontrak: (customData?.kontrakList ?? kontrakList).map((k) => ({
            ...k,
            tanggalMulai: formatDateDDMMYYYY(k.tanggalMulai),
            tanggalBerakhir: formatDateDDMMYYYY(k.tanggalBerakhir),
          })),
          spm: (customData?.spmList ?? spmList).map((s) => ({
            ...s,
            tanggalSpm: formatDateDDMMYYYY(s.tanggalSpm),
          })),
          jurnal_belanja: (customData?.jurnalBelanjaList ?? jurnalBelanjaList).map((j) => ({
            ...j,
            tanggal: formatDateDDMMYYYY(j.tanggal),
          })),
          pengembalian_belanja: (customData?.pengembalianBelanjaList ?? pengembalianBelanjaList).map((p) => ({
            ...p,
            tanggal: formatDateDDMMYYYY(p.tanggal),
          })),
          user: customData?.userList ?? userList,
        },
      };

      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      const resJson = await response.json();
      if (resJson.status === 'success') {
        const now = new Date().toLocaleTimeString('id-ID');
        setGasConfig((prev) => ({ ...prev, lastSyncedAt: now }));
        setSyncStatusMessage({
          type: 'success',
          text: `Berhasil mengupdate data ke Google Spreadsheet jam ${now}!`,
        });
        setIsSyncing(false);
        return true;
      } else {
        throw new Error(resJson.message || 'Gagal menyimpan ke Google Spreadsheet');
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatusMessage({
        type: 'error',
        text: `Gagal sync: ${err.message || 'Periksa URL Apps Script & Izin Akses "Anyone"'}`,
      });
      setIsSyncing(false);
      return false;
    }
  };

  // GAS Config
  const updateGasConfig = (config: Partial<GasConfig>) => {
    setGasConfig((prev) => ({ ...prev, ...config }));
  };

  // Helper trigger auto sync
  const triggerAutoSync = (customData: {
    bidangList?: Bidang[];
    programList?: Program[];
    kegiatanList?: Kegiatan[];
    subKegiatanList?: SubKegiatan[];
    rekeningList?: RekeningPagu[];
    kontrakList?: KontrakPekerjaan[];
    spmList?: RegisterSpm[];
    jurnalBelanjaList?: JurnalBelanja[];
    pengembalianBelanjaList?: PengembalianBelanja[];
    userList?: User[];
  }) => {
    if (gasConfig.webAppUrl && gasConfig.webAppUrl.trim()) {
      syncWebToSpreadsheet(customData, false);
    }
  };

  // CRUD Bidang
  const addBidang = (item: Omit<Bidang, 'id'>) => {
    const newList = [...bidangList, { ...item, id: genId('B') }];
    setBidangList(newList);
    triggerAutoSync({ bidangList: newList });
  };
  const updateBidang = (id: string, item: Omit<Bidang, 'id'>) => {
    const newList = bidangList.map((b) => (b.id === id ? { ...item, id } : b));
    setBidangList(newList);
    triggerAutoSync({ bidangList: newList });
  };
  const deleteBidang = (id: string) => {
    const newList = bidangList.filter((b) => b.id !== id);
    setBidangList(newList);
    triggerAutoSync({ bidangList: newList });
  };

  // CRUD Program
  const addProgram = (item: Omit<Program, 'id'>) => {
    const newList = [...programList, { ...item, id: genId('P') }];
    setProgramList(newList);
    triggerAutoSync({ programList: newList });
  };
  const updateProgram = (id: string, item: Omit<Program, 'id'>) => {
    const newList = programList.map((p) => (p.id === id ? { ...item, id } : p));
    setProgramList(newList);
    triggerAutoSync({ programList: newList });
  };
  const deleteProgram = (id: string) => {
    const newList = programList.filter((p) => p.id !== id);
    setProgramList(newList);
    triggerAutoSync({ programList: newList });
  };

  // CRUD Kegiatan
  const addKegiatan = (item: Omit<Kegiatan, 'id'>) => {
    const newList = [...kegiatanList, { ...item, id: genId('K') }];
    setKegiatanList(newList);
    triggerAutoSync({ kegiatanList: newList });
  };
  const updateKegiatan = (id: string, item: Omit<Kegiatan, 'id'>) => {
    const newList = kegiatanList.map((k) => (k.id === id ? { ...item, id } : k));
    setKegiatanList(newList);
    triggerAutoSync({ kegiatanList: newList });
  };
  const deleteKegiatan = (id: string) => {
    const newList = kegiatanList.filter((k) => k.id !== id);
    setKegiatanList(newList);
    triggerAutoSync({ kegiatanList: newList });
  };

  // CRUD SubKegiatan
  const addSubKegiatan = (item: Omit<SubKegiatan, 'id'>) => {
    const newList = [...subKegiatanList, { ...item, id: genId('SK') }];
    setSubKegiatanList(newList);
    triggerAutoSync({ subKegiatanList: newList });
  };
  const updateSubKegiatan = (id: string, item: Omit<SubKegiatan, 'id'>) => {
    const newList = subKegiatanList.map((sk) => (sk.id === id ? { ...item, id } : sk));
    setSubKegiatanList(newList);
    triggerAutoSync({ subKegiatanList: newList });
  };
  const deleteSubKegiatan = (id: string) => {
    const newList = subKegiatanList.filter((sk) => sk.id !== id);
    setSubKegiatanList(newList);
    triggerAutoSync({ subKegiatanList: newList });
  };

  // CRUD Rekening
  const addRekening = (item: Omit<RekeningPagu, 'id'>) => {
    const newList = [...rekeningList, { ...item, id: genId('R') }];
    setRekeningList(newList);
    triggerAutoSync({ rekeningList: newList });
  };
  const updateRekening = (id: string, item: Omit<RekeningPagu, 'id'>) => {
    const newList = rekeningList.map((r) => (r.id === id ? { ...item, id } : r));
    setRekeningList(newList);
    triggerAutoSync({ rekeningList: newList });
  };
  const deleteRekening = (id: string) => {
    const newList = rekeningList.filter((r) => r.id !== id);
    setRekeningList(newList);
    triggerAutoSync({ rekeningList: newList });
  };

  // CRUD Kontrak
  const addKontrak = (item: Omit<KontrakPekerjaan, 'id'>) => {
    const newList = [...kontrakList, { ...item, id: genId('KT') }];
    setKontrakList(newList);
    triggerAutoSync({ kontrakList: newList });
  };
  const updateKontrak = (id: string, item: Omit<KontrakPekerjaan, 'id'>) => {
    const newList = kontrakList.map((kt) => (kt.id === id ? { ...item, id } : kt));
    setKontrakList(newList);
    triggerAutoSync({ kontrakList: newList });
  };
  const deleteKontrak = (id: string) => {
    const newList = kontrakList.filter((kt) => kt.id !== id);
    setKontrakList(newList);
    triggerAutoSync({ kontrakList: newList });
  };

  // CRUD SPM
  const addSpm = (item: Omit<RegisterSpm, 'id'>) => {
    const newSpmList = [...spmList, { ...item, id: genId('SPM') }];
    setSpmList(newSpmList);
    let newKontrakList = kontrakList;
    if (item.kontrakId) {
      newKontrakList = kontrakList.map((k) =>
        k.id === item.kontrakId
          ? { ...k, persentaseFisik: item.persentaseFisik }
          : k
      );
      setKontrakList(newKontrakList);
    }
    triggerAutoSync({ spmList: newSpmList, kontrakList: newKontrakList });
  };
  const updateSpm = (id: string, item: Omit<RegisterSpm, 'id'>) => {
    const newSpmList = spmList.map((s) => (s.id === id ? { ...item, id } : s));
    setSpmList(newSpmList);
    let newKontrakList = kontrakList;
    if (item.kontrakId) {
      newKontrakList = kontrakList.map((k) =>
        k.id === item.kontrakId
          ? { ...k, persentaseFisik: item.persentaseFisik }
          : k
      );
      setKontrakList(newKontrakList);
    }
    triggerAutoSync({ spmList: newSpmList, kontrakList: newKontrakList });
  };
  const deleteSpm = (id: string) => {
    const newSpmList = spmList.filter((s) => s.id !== id);
    setSpmList(newSpmList);
    triggerAutoSync({ spmList: newSpmList });
  };

  // CRUD Jurnal Belanja
  const addJurnalBelanja = (item: Omit<JurnalBelanja, 'id'>) => {
    const newList = [...jurnalBelanjaList, { ...item, id: genId('JRN') }];
    setJurnalBelanjaList(newList);
    triggerAutoSync({ jurnalBelanjaList: newList });
  };
  const updateJurnalBelanja = (id: string, item: Omit<JurnalBelanja, 'id'>) => {
    const newList = jurnalBelanjaList.map((j) => (j.id === id ? { ...item, id } : j));
    setJurnalBelanjaList(newList);
    triggerAutoSync({ jurnalBelanjaList: newList });
  };
  const deleteJurnalBelanja = (id: string) => {
    const newList = jurnalBelanjaList.filter((j) => j.id !== id);
    setJurnalBelanjaList(newList);
    triggerAutoSync({ jurnalBelanjaList: newList });
  };

  // CRUD Pengembalian Belanja (STS)
  const addPengembalianBelanja = (item: Omit<PengembalianBelanja, 'id'>) => {
    const newList = [...pengembalianBelanjaList, { ...item, id: genId('STS') }];
    setPengembalianBelanjaList(newList);
    triggerAutoSync({ pengembalianBelanjaList: newList });
  };
  const updatePengembalianBelanja = (id: string, item: Omit<PengembalianBelanja, 'id'>) => {
    const newList = pengembalianBelanjaList.map((p) => (p.id === id ? { ...item, id } : p));
    setPengembalianBelanjaList(newList);
    triggerAutoSync({ pengembalianBelanjaList: newList });
  };
  const deletePengembalianBelanja = (id: string) => {
    const newList = pengembalianBelanjaList.filter((p) => p.id !== id);
    setPengembalianBelanjaList(newList);
    triggerAutoSync({ pengembalianBelanjaList: newList });
  };

  // Sync Google Spreadsheet -> Web
  const syncSpreadsheetToWeb = async (isManual = false): Promise<boolean> => {
    const cleanUrl = (gasConfig.webAppUrl && gasConfig.webAppUrl.trim()) ? gasConfig.webAppUrl.trim() : DEFAULT_WEB_APP_URL;

    if (!cleanUrl) {
      if (isManual) {
        setSyncStatusMessage({
          type: 'error',
          text: 'URL Apps Script belum diisi. Masukkan Google Apps Script Web App URL di menu Master Data > Integrasi Spreadsheet.',
        });
      }
      setIsSyncing(false);
      return false;
    }

    setIsSyncing(true);
    setSyncStatusMessage({
      type: 'info',
      text: 'Mengambil data terbaru dari Google Spreadsheet...',
    });

    try {
      const response = await fetch(cleanUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`Server mengembalikan status HTTP ${response.status} ${response.statusText}`);
      }

      const rawText = await response.text();

      let resJson: any;
      try {
        resJson = JSON.parse(rawText);
      } catch (jsonErr) {
        if (rawText.includes('<!DOCTYPE html') || rawText.includes('<html')) {
          throw new Error(
            'URL Apps Script mengembalikan halaman HTML. Pastikan opsi "Who has access" (Siapa yang memiliki akses) di Google Apps Script dipilih "Anyone" (Siapa Saja) dan URL berakhiran /exec.'
          );
        }
        throw new Error('Respon dari Google Apps Script bukan format JSON yang valid.');
      }

      if (resJson.status === 'error') {
        throw new Error(resJson.message || 'Terjadi kesalahan pada Google Apps Script.');
      }

      const d = resJson.data || resJson;

      if (!d || typeof d !== 'object') {
        throw new Error('Format data spreadsheet yang diterima tidak valid.');
      }

      let itemsSyncedCount = 0;

      // 1. Bidang
      const rawBidang = d.bidang || d.Bidang || d.BIDANG || [];
      if (Array.isArray(rawBidang) && rawBidang.length > 0) {
        const parsed = rawBidang
          .map((b: any, idx: number) => ({
            id: String(b.id ?? b.ID ?? b.Id ?? (b.kode ? `B-${b.kode}` : `B-${idx + 1}`)).trim(),
            kode: String(b.kode ?? b.Kode ?? b.KODE ?? '').trim(),
            nama: String(b.nama ?? b.Nama ?? b.NAMA ?? '').trim(),
          }))
          .filter((b) => b.kode || b.nama);
        if (parsed.length > 0) {
          setBidangList(parsed);
          itemsSyncedCount += parsed.length;
        }
      }

      // 2. Program
      const rawProgram = d.program || d.Program || d.PROGRAM || [];
      if (Array.isArray(rawProgram) && rawProgram.length > 0) {
        const parsed = rawProgram
          .map((p: any, idx: number) => ({
            id: String(p.id ?? p.ID ?? p.Id ?? (p.kode ? `P-${p.kode}` : `P-${idx + 1}`)).trim(),
            bidangId: String(p.bidangId ?? p.bidangid ?? p.bidang_id ?? p.BidangId ?? '').trim(),
            kode: String(p.kode ?? p.Kode ?? p.KODE ?? '').trim(),
            nama: String(p.nama ?? p.Nama ?? p.NAMA ?? '').trim(),
          }))
          .filter((p) => p.kode || p.nama);
        if (parsed.length > 0) {
          setProgramList(parsed);
          itemsSyncedCount += parsed.length;
        }
      }

      // 3. Kegiatan
      const rawKegiatan = d.kegiatan || d.Kegiatan || d.KEGIATAN || [];
      if (Array.isArray(rawKegiatan) && rawKegiatan.length > 0) {
        const parsed = rawKegiatan
          .map((k: any, idx: number) => ({
            id: String(k.id ?? k.ID ?? k.Id ?? (k.kode ? `K-${k.kode}` : `K-${idx + 1}`)).trim(),
            programId: String(k.programId ?? k.programid ?? k.program_id ?? k.ProgramId ?? '').trim(),
            kode: String(k.kode ?? k.Kode ?? k.KODE ?? '').trim(),
            nama: String(k.nama ?? k.Nama ?? k.NAMA ?? '').trim(),
          }))
          .filter((k) => k.kode || k.nama);
        if (parsed.length > 0) {
          setKegiatanList(parsed);
          itemsSyncedCount += parsed.length;
        }
      }

      // 4. SubKegiatan
      const rawSubkegiatan = d.subkegiatan || d.Subkegiatan || d.subKegiatan || d.SUBKEGIATAN || [];
      if (Array.isArray(rawSubkegiatan) && rawSubkegiatan.length > 0) {
        const parsed = rawSubkegiatan
          .map((sk: any, idx: number) => ({
            id: String(sk.id ?? sk.ID ?? sk.Id ?? (sk.kode ? `SK-${sk.kode}` : `SK-${idx + 1}`)).trim(),
            kegiatanId: String(sk.kegiatanId ?? sk.kegiatanid ?? sk.kegiatan_id ?? sk.KegiatanId ?? '').trim(),
            kode: String(sk.kode ?? sk.Kode ?? sk.KODE ?? '').trim(),
            nama: String(sk.nama ?? sk.Nama ?? sk.NAMA ?? '').trim(),
          }))
          .filter((sk) => sk.kode || sk.nama);
        if (parsed.length > 0) {
          setSubKegiatanList(parsed);
          itemsSyncedCount += parsed.length;
        }
      }

      // 5. Rekening & Pagu
      const rawRekening = d.rekening || d.Rekening || d.REKENING || [];
      if (Array.isArray(rawRekening) && rawRekening.length > 0) {
        const parsed = rawRekening
          .map((r: any, idx: number) => {
            const subId = String(
              r.subKegiatanId ??
              r.subkegiatanId ??
              r.subkegiatan_id ??
              r.subKegiatan ??
              r.subkegiatan ??
              r.sub_kegiatan_id ??
              ''
            ).trim();

            let rawPagu = r.pagu ?? r.Pagu ?? r.PAGU ?? 0;
            if (typeof rawPagu === 'string') {
              const cleaned = rawPagu.replace(/[^0-9,-]/g, '').replace(',', '.');
              rawPagu = parseFloat(cleaned) || 0;
            } else if (typeof rawPagu !== 'number') {
              rawPagu = Number(rawPagu) || 0;
            }

            const kode = String(r.kode ?? r.Kode ?? r.KODE ?? '').trim();
            const nama = String(r.nama ?? r.Nama ?? r.NAMA ?? '').trim();
            const tahun = String(r.tahun ?? r.Tahun ?? r.TAHUN ?? '2026').trim() as TahunAnggaran;

            const generatedId = String(
              r.id ??
              r.ID ??
              r.Id ??
              (kode ? `R-${kode}-${tahun}` : `R-${idx + 1}`)
            ).trim();

            return {
              id: generatedId,
              subKegiatanId: subId,
              kode,
              nama,
              pagu: rawPagu || 0,
              tahun,
            };
          })
          .filter((r) => r.kode || r.nama || r.pagu > 0);
        if (parsed.length > 0) {
          setRekeningList(parsed);
          itemsSyncedCount += parsed.length;
        }
      }

      // 6. Kontrak
      const rawKontrak = d.kontrak || d.Kontrak || d.KONTRAK || [];
      if (Array.isArray(rawKontrak) && rawKontrak.length > 0) {
        const parsed = rawKontrak
          .map((c: any, idx: number) => {
            let rawNilai = c.nilaiKontrak ?? c.nilaikontrak ?? c.nilai_kontrak ?? c.NilaiKontrak;
            if (typeof rawNilai === 'string') {
              const cleaned = rawNilai.replace(/[^0-9,-]/g, '').replace(',', '.');
              rawNilai = parseFloat(cleaned) || 0;
            } else if (typeof rawNilai !== 'number') {
              rawNilai = Number(rawNilai) || 0;
            }

            const nomorKontrak = String(c.nomorKontrak ?? c.nomorkontrak ?? c.nomor_kontrak ?? '').trim();
            const generatedId = String(
              c.id ??
              c.ID ??
              c.Id ??
              (nomorKontrak ? `KTR-${nomorKontrak}` : `KTR-${idx + 1}`)
            ).trim();

            return {
              id: generatedId,
              bidangId: String(c.bidangId ?? c.bidangid ?? c.bidang_id ?? c.BidangId ?? '').trim(),
              uraian: String(c.uraian ?? c.Uraian ?? '').trim(),
              namaPenyedia: String(c.namaPenyedia ?? c.namapenyedia ?? c.nama_penyedia ?? '').trim(),
              nomorKontrak,
              tanggalMulai: normalizeDateString(c.tanggalMulai ?? c.tanggalmulai ?? c.tanggal_mulai ?? ''),
              tanggalBerakhir: normalizeDateString(c.tanggalBerakhir ?? c.tanggalberakhir ?? c.tanggal_berakhir ?? ''),
              nilaiKontrak: rawNilai || 0,
              persentaseFisik: Number(c.persentaseFisik ?? c.persentasefisik) || 0,
              tahun: String(c.tahun ?? c.Tahun ?? '2026').trim() as TahunAnggaran,
            };
          })
          .filter((c) => c.nomorKontrak || c.uraian || c.nilaiKontrak > 0);
        if (parsed.length > 0) {
          setKontrakList(parsed);
          itemsSyncedCount += parsed.length;
        }
      }

      // 7. SPM
      const rawSpm = d.spm || d.Spm || d.SPM || d.registerSpm || d.register_spm || [];
      if (Array.isArray(rawSpm) && rawSpm.length > 0) {
        const parsed = rawSpm
          .map((s: any, idx: number) => {
            let rawRealisasi = s.realisasiSpm ?? s.realisasispm ?? s.realisasi_spm ?? 0;
            if (typeof rawRealisasi === 'string') {
              const cleaned = rawRealisasi.replace(/[^0-9,-]/g, '').replace(',', '.');
              rawRealisasi = parseFloat(cleaned) || 0;
            } else if (typeof rawRealisasi !== 'number') {
              rawRealisasi = Number(rawRealisasi) || 0;
            }

            // Parse rincianBelanja
            let rawRincian = s.rincianBelanja ?? s.rincianJson ?? s.rincian_json ?? s.rincian ?? [];
            if (typeof rawRincian === 'string') {
              try {
                rawRincian = JSON.parse(rawRincian);
              } catch {
                rawRincian = [];
              }
            }
            if (!Array.isArray(rawRincian)) {
              rawRincian = [];
            }

            const rincianBelanja = rawRincian.map((rb: any, rIdx: number) => {
              let val = rb.nilaiRealisasi ?? rb.nilairealisasi ?? rb.nilai_realisasi ?? 0;
              if (typeof val === 'string') {
                val = parseFloat(val.replace(/[^0-9,-]/g, '').replace(',', '.')) || 0;
              } else if (typeof val !== 'number') {
                val = Number(val) || 0;
              }

              return {
                id: String(rb.id ?? rb.ID ?? `RB-${idx + 1}-${rIdx + 1}`).trim(),
                bidangId: String(rb.bidangId ?? rb.bidangid ?? rb.bidang_id ?? '').trim(),
                programId: String(rb.programId ?? rb.programid ?? rb.program_id ?? '').trim(),
                kegiatanId: String(rb.kegiatanId ?? rb.kegiatanid ?? rb.kegiatan_id ?? '').trim(),
                subKegiatanId: String(rb.subKegiatanId ?? rb.subkegiatanId ?? rb.subkegiatan_id ?? '').trim(),
                rekeningId: String(rb.rekeningId ?? rb.rekeningid ?? rb.rekening_id ?? '').trim(),
                nilaiRealisasi: val || 0,
              };
            });

            // Parse pajak
            let rawPajak = s.pajak ?? s.pajakJson ?? s.pajak_json;
            if (typeof rawPajak === 'string') {
              try {
                rawPajak = JSON.parse(rawPajak);
              } catch {
                rawPajak = null;
              }
            }
            const pajak = {
              ppn: Number(rawPajak?.ppn ?? 0),
              pph21: Number(rawPajak?.pph21 ?? 0),
              pph22: Number(rawPajak?.pph22 ?? 0),
              pph23: Number(rawPajak?.pph23 ?? 0),
              pphPasal4: Number(rawPajak?.pphPasal4 ?? rawPajak?.pphpasal4 ?? 0),
            };

            const nomorSpm = String(s.nomorSpm ?? s.nomorspm ?? s.nomor_spm ?? s.NomorSpm ?? s.NOMOR_SPM ?? '').trim();
            const tanggalSpm = normalizeDateString(s.tanggalSpm ?? s.tanggalspm ?? s.tanggal_spm ?? s.TanggalSpm ?? '');

            let bidangId = String(s.bidangId ?? s.bidangid ?? s.bidang_id ?? s.BidangId ?? '').trim();
            if (!bidangId && rincianBelanja.length > 0) {
              bidangId = rincianBelanja[0].bidangId;
            }

            const generatedId = String(
              s.id ??
              s.ID ??
              s.Id ??
              (nomorSpm ? `SPM-${nomorSpm}` : `SPM-${idx + 1}`)
            ).trim();

            return {
              id: generatedId,
              nomorSpm,
              tanggalSpm,
              jenisBelanja: String(s.jenisBelanja ?? s.jenisbelanja ?? s.jenis_belanja ?? 'LS').trim(),
              bidangId,
              kontrakId: s.kontrakId || s.kontrakid || s.kontrak_id ? String(s.kontrakId ?? s.kontrakid ?? s.kontrak_id).trim() : undefined,
              uraianPekerjaan: String(s.uraianPekerjaan ?? s.uraianpekerjaan ?? s.uraian_pekerjaan ?? s.uraian ?? '').trim(),
              persentaseFisik: Number(s.persentaseFisik ?? s.persentasefisik) || 0,
              rincianBelanja,
              realisasiSpm: rawRealisasi || 0,
              pajak,
              tahun: String(s.tahun ?? s.Tahun ?? '2026').trim() as TahunAnggaran,
            };
          })
          .filter((s) => s.nomorSpm || s.uraianPekerjaan || s.realisasiSpm > 0 || s.rincianBelanja.length > 0);
        if (parsed.length > 0) {
          setSpmList(parsed);
          itemsSyncedCount += parsed.length;
        }
      }

      // 8. User / Pengguna
      const rawUser = d.user || d.User || d.users || d.Users || [];
      if (Array.isArray(rawUser) && rawUser.length > 0) {
        const parsed = rawUser
          .map((u: any) => {
            const username = String(u.username ?? u.Username ?? u.USERNAME ?? '').trim();
            const passwordHash = String(u.passwordHash ?? u.password ?? u.Password ?? u.PASSWORD ?? '').trim();
            const namaLengkap = String(
              u.namaLengkap ?? u.namalengkap ?? u.nama_lengkap ?? u.NamaLengkap ?? username
            ).trim();
            const jabatan = String(u.jabatan ?? u.Jabatan ?? 'Pengelola Keuangan').trim();
            let role = String(u.role ?? u.Role ?? '').toLowerCase().trim() as 'admin' | 'user' | 'guest';
            if (!role || (role !== 'admin' && role !== 'user' && role !== 'guest')) {
              if (username.toLowerCase() === 'admin') role = 'admin';
              else if (username.toLowerCase() === 'guest' || username.toLowerCase() === 'tamu') role = 'guest';
              else role = 'user';
            }
            return {
              username,
              passwordHash,
              namaLengkap,
              jabatan,
              role,
            };
          })
          .filter((u) => u.username && u.passwordHash);

        if (parsed.length > 0) {
          setUserList(parsed);
          localStorage.setItem('REG_SPM_USER_LIST', JSON.stringify(parsed));
          itemsSyncedCount += parsed.length;

          // Update current logged-in user state if credentials/details were updated in spreadsheet
          const activeUpdated = parsed.find(
            (p) => p.username.trim().toLowerCase() === user.username.trim().toLowerCase()
          );
          if (activeUpdated) {
            setUser(activeUpdated);
            localStorage.setItem('REG_SPM_USER', JSON.stringify(activeUpdated));
          }
        }
      }

      // 9. Jurnal Belanja
      const rawJurnal = d.jurnal_belanja || d.jurnalBelanja || d.jurnal || d.JurnalBelanja || [];
      if (Array.isArray(rawJurnal) && rawJurnal.length > 0) {
        const parsed = rawJurnal
          .map((j: any, idx: number) => {
            let rawJumlah = j.jumlah ?? j.Jumlah ?? j.JUMLAH ?? 0;
            if (typeof rawJumlah === 'string') {
              const cleaned = rawJumlah.replace(/[^0-9,-]/g, '').replace(',', '.');
              rawJumlah = parseFloat(cleaned) || 0;
            } else if (typeof rawJumlah !== 'number') {
              rawJumlah = Number(rawJumlah) || 0;
            }

            const nomorJurnal = String(j.nomorJurnal ?? j.nomorjurnal ?? j.nomor_jurnal ?? '').trim();
            const tanggal = normalizeDateString(j.tanggal ?? j.Tanggal ?? '');
            const generatedId = String(
              j.id ?? j.ID ?? j.Id ?? (nomorJurnal ? `JRN-${nomorJurnal}` : `JRN-${idx + 1}`)
            ).trim();

            const rekAsalId = String(j.rekeningAsalId ?? j.rekeningasalid ?? j.rekening_asal_id ?? '').trim();
            const rekTujuanId = String(j.rekeningTujuanId ?? j.rekeningtujuanid ?? j.rekening_tujuan_id ?? '').trim();

            // Parse rincianAsal
            let rincianAsal: any[] = [];
            if (Array.isArray(j.rincianAsal)) {
              rincianAsal = j.rincianAsal;
            } else if (typeof j.rincianAsalJson === 'string' && j.rincianAsalJson.trim().length > 0) {
              try { rincianAsal = JSON.parse(j.rincianAsalJson); } catch {}
            } else if (typeof j.rincian_asal_json === 'string' && j.rincian_asal_json.trim().length > 0) {
              try { rincianAsal = JSON.parse(j.rincian_asal_json); } catch {}
            }
            if (!Array.isArray(rincianAsal) || rincianAsal.length === 0) {
              if (rekAsalId) {
                rincianAsal = [{ id: `RA-${idx}-1`, rekeningId: rekAsalId, jumlah: rawJumlah }];
              } else {
                rincianAsal = [];
              }
            }

            // Parse rincianTujuan
            let rincianTujuan: any[] = [];
            if (Array.isArray(j.rincianTujuan)) {
              rincianTujuan = j.rincianTujuan;
            } else if (typeof j.rincianTujuanJson === 'string' && j.rincianTujuanJson.trim().length > 0) {
              try { rincianTujuan = JSON.parse(j.rincianTujuanJson); } catch {}
            } else if (typeof j.rincian_tujuan_json === 'string' && j.rincian_tujuan_json.trim().length > 0) {
              try { rincianTujuan = JSON.parse(j.rincian_tujuan_json); } catch {}
            }
            if (!Array.isArray(rincianTujuan) || rincianTujuan.length === 0) {
              if (rekTujuanId) {
                rincianTujuan = [{ id: `RT-${idx}-1`, rekeningId: rekTujuanId, jumlah: rawJumlah }];
              } else {
                rincianTujuan = [];
              }
            }

            return {
              id: generatedId,
              nomorJurnal: nomorJurnal || `JRN/${idx + 1}`,
              tanggal,
              bidangId: String(j.bidangId ?? j.bidangid ?? j.bidang_id ?? '').trim(),
              rekeningAsalId: rekAsalId,
              rekeningTujuanId: rekTujuanId,
              rincianAsal,
              rincianTujuan,
              jumlah: rawJumlah || 0,
              keterangan: String(j.keterangan ?? j.Keterangan ?? '').trim(),
              tahun: String(j.tahun ?? j.Tahun ?? '2026').trim() as TahunAnggaran,
            };
          })
          .filter((j) => j.nomorJurnal || j.jumlah > 0 || j.keterangan);

        if (parsed.length > 0) {
          setJurnalBelanjaList(parsed);
          itemsSyncedCount += parsed.length;
        }
      }

      // 10. Pengembalian Belanja (STS)
      const rawPengembalian = d.pengembalian_belanja || d.pengembalianBelanja || d.pengembalian || [];
      if (Array.isArray(rawPengembalian) && rawPengembalian.length > 0) {
        const parsed = rawPengembalian
          .map((p: any, idx: number) => {
            let rawNilai = p.totalNilai ?? p.totalnilai ?? p.total_nilai ?? p.Nilai ?? p.nilai ?? 0;
            if (typeof rawNilai === 'string') {
              const cleaned = rawNilai.replace(/[^0-9,-]/g, '').replace(',', '.');
              rawNilai = parseFloat(cleaned) || 0;
            } else if (typeof rawNilai !== 'number') {
              rawNilai = Number(rawNilai) || 0;
            }

            const nomorSts = String(p.nomorSts ?? p.nomorsts ?? p.nomor_sts ?? '').trim();
            const tanggal = normalizeDateString(p.tanggal ?? p.Tanggal ?? '');
            const generatedId = String(
              p.id ?? p.ID ?? p.Id ?? (nomorSts ? `STS-${nomorSts}` : `STS-${idx + 1}`)
            ).trim();

            let rincianPengembalian: any[] = [];
            if (Array.isArray(p.rincianPengembalian)) {
              rincianPengembalian = p.rincianPengembalian;
            } else if (typeof p.rincianJson === 'string' && p.rincianJson.trim().length > 0) {
              try { rincianPengembalian = JSON.parse(p.rincianJson); } catch {}
            } else if (typeof p.rincian_json === 'string' && p.rincian_json.trim().length > 0) {
              try { rincianPengembalian = JSON.parse(p.rincian_json); } catch {}
            }

            const formattedRincian = rincianPengembalian.map((r: any, rIdx: number) => {
              let rNominal = r.nominal ?? r.Nominal ?? r.jumlah ?? 0;
              if (typeof rNominal === 'string') {
                rNominal = parseFloat(rNominal.replace(/[^0-9,-]/g, '').replace(',', '.')) || 0;
              }
              return {
                id: String(r.id ?? `RP-${idx + 1}-${rIdx + 1}`).trim(),
                bidangId: String(r.bidangId ?? r.bidang_id ?? '').trim(),
                programId: String(r.programId ?? r.program_id ?? '').trim(),
                kegiatanId: String(r.kegiatanId ?? r.kegiatan_id ?? '').trim(),
                subKegiatanId: String(r.subKegiatanId ?? r.subkegiatan_id ?? '').trim(),
                rekeningId: String(r.rekeningId ?? r.rekening_id ?? '').trim(),
                nominal: rNominal || 0,
              };
            });

            return {
              id: generatedId,
              nomorSts: nomorSts || `STS/${idx + 1}`,
              tanggal,
              keterangan: String(p.keterangan ?? p.Keterangan ?? '').trim(),
              totalNilai: rawNilai || formattedRincian.reduce((acc: number, item: any) => acc + item.nominal, 0),
              rincianPengembalian: formattedRincian,
              tahun: String(p.tahun ?? p.Tahun ?? '2026').trim() as TahunAnggaran,
            };
          })
          .filter((p) => p.nomorSts || p.totalNilai > 0 || p.keterangan);

        if (parsed.length > 0) {
          setPengembalianBelanjaList(parsed);
          itemsSyncedCount += parsed.length;
        }
      }

      const now = new Date().toLocaleTimeString('id-ID');
      updateGasConfig({ lastSyncedAt: now });
      setSyncStatusMessage({
        type: 'success',
        text: itemsSyncedCount > 0
          ? `Berhasil mengambil ${itemsSyncedCount} data dari Google Spreadsheet jam ${now}!`
          : `Koneksi sukses! Spreadsheet belum berisi baris data baru jam ${now}.`,
      });
      setIsSyncing(false);
      return true;
    } catch (err: any) {
      console.error(err);
      setSyncStatusMessage({
        type: 'error',
        text: `Gagal mengambil data: ${err.message || 'Periksa koneksi atau URL Apps Script'}`,
      });
      setIsSyncing(false);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        activeTab: currentView,
        setActiveTab: setCurrentView,
        sidebarOpen,
        setSidebarOpen,
        isLoginModalOpen,
        setIsLoginModalOpen,

        selectedYear,
        setSelectedYear,
        user,
        userList,
        addUser,
        updateUser,
        deleteUser,
        isAdmin,
        isGuest,
        canEdit,
        isLoggedIn,
        login,
        loginAs,
        logout,
        updateUserCredentials,

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

        kontrakList,
        addKontrak,
        updateKontrak,
        deleteKontrak,

        spmList,
        addSpm,
        updateSpm,
        deleteSpm,

        jurnalBelanjaList,
        addJurnalBelanja,
        updateJurnalBelanja,
        deleteJurnalBelanja,

        pengembalianBelanjaList,
        addPengembalianBelanja,
        updatePengembalianBelanja,
        deletePengembalianBelanja,

        gasConfig,
        updateGasConfig,
        isSyncing,
        syncStatusMessage,
        syncWebToSpreadsheet,
        syncSpreadsheetToWeb,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
