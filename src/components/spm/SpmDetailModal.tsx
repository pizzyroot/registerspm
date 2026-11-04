import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RegisterSpm } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { X, Receipt, Layers, Briefcase, Building2, Calendar, FileText } from 'lucide-react';

interface SpmDetailModalProps {
  spm: RegisterSpm;
  onClose: () => void;
}

export const SpmDetailModal: React.FC<SpmDetailModalProps> = ({ spm, onClose }) => {
  const { subKegiatanList, rekeningList, kontrakList, bidangList } = useApp();

  // Lock background scroll when dialog modal opens
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!spm) return null;

  const rincianList = Array.isArray(spm.rincianBelanja) ? spm.rincianBelanja : [];
  const pajak = spm.pajak || { ppn: 0, pph21: 0, pph22: 0, pph23: 0, pphPasal4: 0 };
  const totalPajak = (pajak.ppn || 0) + (pajak.pph21 || 0) + (pajak.pph22 || 0) + (pajak.pph23 || 0) + (pajak.pphPasal4 || 0);

  const linkedKontrak = kontrakList.find((k) => String(k.id) === String(spm.kontrakId));
  const linkedBidang = bidangList.find((b) => String(b.id) === String(spm.bidangId));

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div 
        className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] my-auto animate-fade-in relative z-[100000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-100 text-sky-800 rounded-2xl shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900 font-mono">
                  SPM: {spm.nomorSpm}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  {spm.jenisBelanja || 'LS'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDateIndo(spm.tanggalSpm)}
                </span>
                {linkedBidang && (
                  <span className="flex items-center gap-1 font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 text-[11px]">
                    <Building2 className="w-3 h-3" />
                    {linkedBidang.nama}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Tutup Detail SPM"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* General Info Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <div>
              <span className="text-slate-500 font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                Uraian Pekerjaan SPM:
              </span>
              <p className="font-bold text-slate-900 text-sm mt-1 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                {spm.uraianPekerjaan || '-'}
              </p>
            </div>

            {/* Linked Contract if available */}
            {linkedKontrak && (
              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl space-y-1 text-xs">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-amber-700" />
                  <span>Terhubung Kontrak: {linkedKontrak.nomorKontrak}</span>
                </div>
                <p className="text-amber-800 text-[11px] font-medium">
                  Penyedia: <strong className="font-bold">{linkedKontrak.namaPenyedia}</strong> | Nilai Kontrak: <strong className="font-extrabold">{formatRupiah(linkedKontrak.nilaiKontrak)}</strong>
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-600 font-bold text-xs">Total Realisasi SPM:</span>
              <span className="font-black text-emerald-700 text-base font-mono">
                {formatRupiah(spm.realisasiSpm)}
              </span>
            </div>
          </div>

          {/* Breakdown Rincian Belanja */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between font-heading">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-600" />
                Rincian Objek Belanja ({rincianList.length} Rekening)
              </span>
            </h4>

            {rincianList.length > 0 ? (
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                {rincianList.map((rb, idx) => {
                  if (!rb || typeof rb !== 'object') return null;
                  const sub = subKegiatanList.find((sk) => String(sk.id) === String(rb.subKegiatanId));
                  const rek = rekeningList.find((r) => String(r.id) === String(rb.rekeningId));
                  const nilai = typeof rb.nilaiRealisasi === 'number' ? rb.nilaiRealisasi : parseFloat(String(rb.nilaiRealisasi || 0)) || 0;

                  return (
                    <div key={idx} className="p-3 bg-white flex items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                      <div className="space-y-0.5">
                        <div className="font-mono font-bold text-sky-700 flex items-center gap-1.5 text-xs">
                          <span>[{rek?.kode || '-'}]</span>
                          <span className="text-slate-900 font-semibold font-sans">{rek?.nama || 'Rekening Objek Belanja'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Sub-Kegiatan: {sub ? `[${sub.kode}] ${sub.nama}` : '-'}
                        </div>
                      </div>
                      <div className="font-black text-slate-900 text-right shrink-0 font-mono text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        {formatRupiah(nilai)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 text-slate-500 rounded-2xl text-xs font-medium text-center">
                Belum ada rincian rekening objek belanja untuk SPM ini.
              </div>
            )}
          </div>

          {/* Taxes Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-heading">
                Rincian Potongan Pajak SPM
              </h4>
              <span className="text-xs font-extrabold text-slate-700">
                Total Pajak: <span className="text-slate-900 font-mono">{formatRupiah(totalPajak)}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-500 font-bold">PPN 11%</div>
                <div className="font-bold text-slate-900 font-mono mt-0.5">
                  {formatRupiah(pajak.ppn || 0)}
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-500 font-bold">PPh 21</div>
                <div className="font-bold text-slate-900 font-mono mt-0.5">
                  {formatRupiah(pajak.pph21 || 0)}
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-500 font-bold">PPh 22</div>
                <div className="font-bold text-slate-900 font-mono mt-0.5">
                  {formatRupiah(pajak.pph22 || 0)}
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-500 font-bold">PPh 23</div>
                <div className="font-bold text-slate-900 font-mono mt-0.5">
                  {formatRupiah(pajak.pph23 || 0)}
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-500 font-bold">PPh Pasal 4(2)</div>
                <div className="font-bold text-slate-900 font-mono mt-0.5">
                  {formatRupiah(pajak.pphPasal4 || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-200 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
