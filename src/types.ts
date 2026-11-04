export type TahunAnggaran = '2026' | '2027' | '2028' | '2029' | '2030';

export type JenisBelanja = 'UP' | 'GU' | 'TU' | 'LS' | 'Gaji dan Tunjangan';

export type UserRole = 'admin' | 'user' | 'guest';

export interface User {
  username: string;
  passwordHash: string; // Plain/hashed password for local app
  namaLengkap: string;
  jabatan: string;
  role: UserRole;
}

export interface Bidang {
  id: string;
  kode: string;
  nama: string;
}

export interface Program {
  id: string;
  bidangId: string;
  kode: string;
  nama: string;
}

export interface Kegiatan {
  id: string;
  programId: string;
  kode: string;
  nama: string;
}

export interface SubKegiatan {
  id: string;
  kegiatanId: string;
  kode: string;
  nama: string;
}

export interface RekeningPagu {
  id: string;
  subKegiatanId: string;
  kode: string;
  nama: string;
  pagu: number;
  tahun: TahunAnggaran;
}

export interface KontrakPekerjaan {
  id: string;
  bidangId: string;
  uraian: string; // Nama Pekerjaan
  namaPenyedia: string; // Pelaksana / CV / PT
  nomorKontrak: string;
  tanggalMulai: string; // YYYY-MM-DD
  tanggalBerakhir: string; // YYYY-MM-DD
  nilaiKontrak: number;
  persentaseFisik: number; // 0-100
  tahun: TahunAnggaran;
}

export interface RincianBelanjaSpm {
  id: string;
  bidangId: string;
  programId: string;
  kegiatanId: string;
  subKegiatanId: string;
  rekeningId: string;
  nilaiRealisasi: number;
}

export interface PajakSpm {
  ppn: number;
  pph21: number;
  pph22: number;
  pph23: number;
  pphPasal4: number;
}

export interface RegisterSpm {
  id: string;
  nomorSpm: string;
  tanggalSpm: string; // YYYY-MM-DD
  jenisBelanja: JenisBelanja;
  bidangId: string;
  kontrakId?: string; // Optional connection to contract
  uraianPekerjaan: string;
  persentaseFisik: number; // 0-100
  rincianBelanja: RincianBelanjaSpm[];
  realisasiSpm: number;
  pajak: PajakSpm;
  tahun: TahunAnggaran;
}

export interface FilterSpm {
  startDate: string;
  endDate: string;
  searchQuery: string; // no spm / uraian / kontrak
  bidangId: string;
  jenisBelanja: string; // 'all' or specific
  limit: number; // 20, 50, 100, 0 (all)
}

export interface FilterPekerjaan {
  startDate: string;
  endDate: string;
  bidangId: string;
  searchQuery: string;
  statusProgress: 'all' | 'mendekati' | 'belum_selesai' | 'selesai';
  limit?: number; // 20, 50, 100, 0 (all)
}

export interface FilterRekap {
  startDate: string;
  endDate: string;
  bidangId: string;
  jenisBelanja: string;
  hideRekening?: boolean;
}

export interface RincianRekeningJurnal {
  id: string;
  bidangId?: string;
  programId?: string;
  kegiatanId?: string;
  subKegiatanId?: string;
  rekeningId: string;
  jumlah: number;
}

export interface JurnalBelanja {
  id: string;
  nomorJurnal: string;
  tanggal: string; // YYYY-MM-DD or DD-MM-YYYY
  bidangId: string;
  rincianAsal: RincianRekeningJurnal[];
  rincianTujuan: RincianRekeningJurnal[];
  jumlah: number; // Total transfer amount
  keterangan: string;
  tahun: TahunAnggaran;
  rekeningAsalId?: string; // Optional fallback
  rekeningTujuanId?: string; // Optional fallback
}

export interface RincianPengembalianBelanja {
  id: string;
  bidangId?: string;
  programId?: string;
  kegiatanId?: string;
  subKegiatanId?: string;
  rekeningId: string;
  nominal: number;
}

export interface PengembalianBelanja {
  id: string;
  nomorSts: string;
  tanggal: string; // YYYY-MM-DD or DD-MM-YYYY
  keterangan: string;
  totalNilai: number;
  rincianPengembalian: RincianPengembalianBelanja[];
  tahun: TahunAnggaran;
}

export interface GasConfig {
  webAppUrl: string;
  lastSyncedAt?: string;
  autoSync: boolean;
}
