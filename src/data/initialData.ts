import {
  Bidang,
  Program,
  Kegiatan,
  SubKegiatan,
  RekeningPagu,
  KontrakPekerjaan,
  RegisterSpm,
  JurnalBelanja,
  PengembalianBelanja,
  User,
} from '../types';

export const initialUser: User = {
  username: 'admin',
  passwordHash: 'admin123',
  namaLengkap: 'Administrator Utama',
  jabatan: 'Pengelola Keuangan & Full Admin',
  role: 'admin',
};

export const initialRegularUser: User = {
  username: 'user',
  passwordHash: 'user123',
  namaLengkap: 'User Pengguna SPM',
  jabatan: 'Staf / Input SPM Keuangan',
  role: 'user',
};

export const initialGuestUser: User = {
  username: 'guest',
  passwordHash: 'guest123',
  namaLengkap: 'Guest / Tamu',
  jabatan: 'Tamu (Hanya Melihat Data)',
  role: 'guest',
};

export const initialUserList: User[] = [initialUser, initialRegularUser, initialGuestUser];

export const initialBidang: Bidang[] = [];
export const initialProgram: Program[] = [];
export const initialKegiatan: Kegiatan[] = [];
export const initialSubKegiatan: SubKegiatan[] = [];
export const initialRekening: RekeningPagu[] = [];
export const initialKontrak: KontrakPekerjaan[] = [];
export const initialSpm: RegisterSpm[] = [];
export const initialJurnalBelanja: JurnalBelanja[] = [];
export const initialPengembalianBelanja: PengembalianBelanja[] = [];

