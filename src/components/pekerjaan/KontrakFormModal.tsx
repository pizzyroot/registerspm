import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KontrakPekerjaan } from '../../types';
import { X, Check, AlertCircle } from 'lucide-react';

interface KontrakFormModalProps {
  kontrakToEdit?: KontrakPekerjaan | null;
  onClose: () => void;
}

export const KontrakFormModal: React.FC<KontrakFormModalProps> = ({
  kontrakToEdit,
  onClose,
}) => {
  const { selectedYear, bidangList, addKontrak, updateKontrak } = useApp();

  const [bidangId, setBidangId] = useState(
    kontrakToEdit?.bidangId || bidangList[0]?.id || ''
  );
  const [uraian, setUraian] = useState(kontrakToEdit?.uraian || '');
  const [namaPenyedia, setNamaPenyedia] = useState(kontrakToEdit?.namaPenyedia || '');
  const [nomorKontrak, setNomorKontrak] = useState(
    kontrakToEdit?.nomorKontrak || `602.${Math.floor(Math.random() * 90) + 10}/KTR/DPU/${selectedYear}`
  );
  const [tanggalMulai, setTanggalMulai] = useState(
    kontrakToEdit?.tanggalMulai || `${selectedYear}-02-01`
  );
  const [tanggalBerakhir, setTanggalBerakhir] = useState(
    kontrakToEdit?.tanggalBerakhir || `${selectedYear}-10-31`
  );
  const [nilaiKontrak, setNilaiKontrak] = useState<number>(
    kontrakToEdit?.nilaiKontrak || 100000000
  );
  const [persentaseFisik, setPersentaseFisik] = useState<number>(
    kontrakToEdit?.persentaseFisik || 0
  );

  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!uraian.trim()) {
      setErrorMsg('Nama Pekerjaan / Uraian wajib diisi!');
      return;
    }
    if (!namaPenyedia.trim()) {
      setErrorMsg('Nama Penyedia / Pelaksana wajib diisi!');
      return;
    }
    if (!nomorKontrak.trim()) {
      setErrorMsg('Nomor Kontrak wajib diisi!');
      return;
    }

    const payload: Omit<KontrakPekerjaan, 'id'> = {
      bidangId,
      uraian,
      namaPenyedia,
      nomorKontrak,
      tanggalMulai,
      tanggalBerakhir,
      nilaiKontrak,
      persentaseFisik,
      tahun: selectedYear,
    };

    if (kontrakToEdit) {
      updateKontrak(kontrakToEdit.id, payload);
    } else {
      addKontrak(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-base text-white">
              {kontrakToEdit ? 'Edit Kontrak Pekerjaan' : 'Input Kontrak Pekerjaan Baru'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto grow text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bidang Penanggung Jawab *
              </label>
              <select
                value={bidangId}
                onChange={(e) => setBidangId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {bidangList.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{b.kode}] {b.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Kontrak *
              </label>
              <input
                type="text"
                required
                value={nomorKontrak}
                onChange={(e) => setNomorKontrak(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Pekerjaan / Uraian Kontrak *
              </label>
              <textarea
                required
                rows={2}
                value={uraian}
                onChange={(e) => setUraian(e.target.value)}
                placeholder="Nama lengkap paket pekerjaan konstruksi / pengadaan / konsultansi..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Penyedia / Pelaksana (PT / CV / Firma) *
              </label>
              <input
                type="text"
                required
                value={namaPenyedia}
                onChange={(e) => setNamaPenyedia(e.target.value)}
                placeholder="Contoh: PT Wijaya Karya Utama"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Mulai Kontrak *
              </label>
              <input
                type="date"
                required
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Berakhir Kontrak *
              </label>
              <input
                type="date"
                required
                value={tanggalBerakhir}
                onChange={(e) => setTanggalBerakhir(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nilai Kontrak (Rp) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={nilaiKontrak}
                onChange={(e) => setNilaiKontrak(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Persentase Fisik Saat Ini (%) *
              </label>
              <input
                type="number"
                required
                min={0}
                max={100}
                value={persentaseFisik}
                onChange={(e) => setPersentaseFisik(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{kontrakToEdit ? 'Simpan Perubahan' : 'Simpan Kontrak Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
