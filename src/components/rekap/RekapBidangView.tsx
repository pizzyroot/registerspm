import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FilterRekap } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import {
  exportTableToExcel,
  exportTableToPdf,
  exportRekapBidangHierarchyToPdf,
  RekapBidangItemRow,
} from '../../utils/exporters';
import {
  Layers,
  FileSpreadsheet,
  FileText,
  Filter,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Calendar,
} from 'lucide-react';

export const RekapBidangView: React.FC = () => {
  const {
    selectedYear,
    bidangList,
    programList,
    kegiatanList,
    subKegiatanList,
    rekeningList,
    spmList,
    jurnalBelanjaList,
    pengembalianBelanjaList,
  } = useApp();

  const [filter, setFilter] = useState<FilterRekap>({
    startDate: '',
    endDate: '',
    bidangId: 'all',
    jenisBelanja: 'all',
    hideRekening: false,
  });

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    all: true,
  });

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered SPM list
  const filteredSpm = useMemo(() => {
    return spmList
      .filter((s) => s.tahun === selectedYear)
      .filter((s) => {
        if (filter.startDate && new Date(s.tanggalSpm) < new Date(filter.startDate)) return false;
        if (filter.endDate && new Date(s.tanggalSpm) > new Date(filter.endDate)) return false;
        if (filter.jenisBelanja !== 'all' && s.jenisBelanja !== filter.jenisBelanja) return false;
        return true;
      });
  }, [spmList, selectedYear, filter]);

  // Filtered Jurnal Belanja list
  const filteredJurnal = useMemo(() => {
    return jurnalBelanjaList
      .filter((j) => j.tahun === selectedYear)
      .filter((j) => {
        if (filter.startDate && new Date(j.tanggal) < new Date(filter.startDate)) return false;
        if (filter.endDate && new Date(j.tanggal) > new Date(filter.endDate)) return false;
        return true;
      });
  }, [jurnalBelanjaList, selectedYear, filter]);

  // Filtered Pengembalian Belanja (STS) list
  const filteredPengembalian = useMemo(() => {
    return pengembalianBelanjaList
      .filter((p) => p.tahun === selectedYear)
      .filter((p) => {
        if (filter.startDate && new Date(p.tanggal) < new Date(filter.startDate)) return false;
        if (filter.endDate && new Date(p.tanggal) > new Date(filter.endDate)) return false;
        return true;
      });
  }, [pengembalianBelanjaList, selectedYear, filter]);

  // Compute Hierarchy Tree Data
  const treeData = useMemo(() => {
    const activeBidang =
      filter.bidangId === 'all'
        ? bidangList
        : bidangList.filter((b) => b.id === filter.bidangId);

    let grandPagu = 0;
    let grandRealisasi = 0;

    const bidangNodes = activeBidang.map((bidang) => {
      // Find programs
      const progs = programList.filter((p) => p.bidangId === bidang.id);

      let bidangPagu = 0;
      let bidangRealisasi = 0;

      const programNodes = progs.map((program) => {
        const kegs = kegiatanList.filter((k) => k.programId === program.id);

        let progPagu = 0;
        let progRealisasi = 0;

        const kegiatanNodes = kegs.map((kegiatan) => {
          const subs = subKegiatanList.filter((sk) => sk.kegiatanId === kegiatan.id);

          let kegPagu = 0;
          let kegRealisasi = 0;

          const subNodes = subs.map((sub) => {
            const reks = rekeningList.filter(
              (r) => r.subKegiatanId === sub.id && r.tahun === selectedYear
            );

            let subPagu = 0;
            let subRealisasi = 0;

            const rekeningNodes = reks.map((rek) => {
              // Calculate SPM realisasi for this specific rekening
              let rekReal = 0;
              filteredSpm.forEach((s) => {
                s.rincianBelanja.forEach((rc) => {
                  if (rc.rekeningId === rek.id) {
                    rekReal += rc.nilaiRealisasi || 0;
                  }
                });
              });

              // Subtract Pengembalian Belanja (STS)
              filteredPengembalian.forEach((p) => {
                p.rincianPengembalian.forEach((rp) => {
                  if (rp.rekeningId === rek.id) {
                    rekReal -= rp.nominal || 0;
                  }
                });
              });

              // Adjust with Jurnal Belanja transfers
              filteredJurnal.forEach((j) => {
                if (j.rincianAsal && j.rincianAsal.length > 0) {
                  j.rincianAsal.forEach((ra) => {
                    if (ra.rekeningId === rek.id) {
                      rekReal -= ra.jumlah || 0;
                    }
                  });
                } else if (j.rekeningAsalId === rek.id) {
                  rekReal -= j.jumlah || 0;
                }

                if (j.rincianTujuan && j.rincianTujuan.length > 0) {
                  j.rincianTujuan.forEach((rt) => {
                    if (rt.rekeningId === rek.id) {
                      rekReal += rt.jumlah || 0;
                    }
                  });
                } else if (j.rekeningTujuanId === rek.id) {
                  rekReal += j.jumlah || 0;
                }
              });

              subPagu += rek.pagu;
              subRealisasi += rekReal;

              return {
                rek,
                pagu: rek.pagu,
                realisasi: rekReal,
                sisa: rek.pagu - rekReal,
                persentase: rek.pagu > 0 ? (rekReal / rek.pagu) * 100 : 0,
              };
            });

            kegPagu += subPagu;
            kegRealisasi += subRealisasi;

            return {
              sub,
              rekeningNodes,
              pagu: subPagu,
              realisasi: subRealisasi,
              sisa: subPagu - subRealisasi,
              persentase: subPagu > 0 ? (subRealisasi / subPagu) * 100 : 0,
            };
          });

          progPagu += kegPagu;
          progRealisasi += kegRealisasi;

          return {
            kegiatan,
            subNodes,
            pagu: kegPagu,
            realisasi: kegRealisasi,
            sisa: kegPagu - kegRealisasi,
            persentase: kegPagu > 0 ? (kegRealisasi / kegPagu) * 100 : 0,
          };
        });

        bidangPagu += progPagu;
        bidangRealisasi += progRealisasi;

        return {
          program,
          kegiatanNodes,
          pagu: progPagu,
          realisasi: progRealisasi,
          sisa: progPagu - progRealisasi,
          persentase: progPagu > 0 ? (progRealisasi / progPagu) * 100 : 0,
        };
      });

      grandPagu += bidangPagu;
      grandRealisasi += bidangRealisasi;

      return {
        bidang,
        programNodes,
        pagu: bidangPagu,
        realisasi: bidangRealisasi,
        sisa: bidangPagu - bidangRealisasi,
        persentase: bidangPagu > 0 ? (bidangRealisasi / bidangPagu) * 100 : 0,
      };
    });

    return {
      bidangNodes,
      grandPagu,
      grandRealisasi,
      grandSisa: grandPagu - grandRealisasi,
      grandPersentase: grandPagu > 0 ? (grandRealisasi / grandPagu) * 100 : 0,
    };
  }, [
    filter,
    selectedYear,
    bidangList,
    programList,
    kegiatanList,
    subKegiatanList,
    rekeningList,
    filteredSpm,
  ]);

  // Export Excel
  const handleExportExcel = () => {
    const headers = [
      'Kode Hirarki',
      'Uraian (Bidang / Program / Kegiatan / Sub / Rekening)',
      'Pagu Anggaran (Rp)',
      'Realisasi (Rp)',
      'Persentase (%)',
      'Sisa Anggaran (Rp)',
    ];

    const rows: (string | number)[][] = [];

    treeData.bidangNodes.forEach((bNode) => {
      rows.push([
        bNode.bidang.kode,
        `BIDANG: ${bNode.bidang.nama.toUpperCase()}`,
        bNode.pagu,
        bNode.realisasi,
        `${bNode.persentase.toFixed(2)}%`,
        bNode.sisa,
      ]);

      bNode.programNodes.forEach((pNode) => {
        rows.push([
          pNode.program.kode,
          `  - Program: ${pNode.program.nama}`,
          pNode.pagu,
          pNode.realisasi,
          `${pNode.persentase.toFixed(2)}%`,
          pNode.sisa,
        ]);

        pNode.kegiatanNodes.forEach((kNode) => {
          rows.push([
            kNode.kegiatan.kode,
            `    -- Kegiatan: ${kNode.kegiatan.nama}`,
            kNode.pagu,
            kNode.realisasi,
            `${kNode.persentase.toFixed(2)}%`,
            kNode.sisa,
          ]);

          kNode.subNodes.forEach((sNode) => {
            rows.push([
              sNode.sub.kode,
              `      --- Sub Kegiatan: ${sNode.sub.nama}`,
              sNode.pagu,
              sNode.realisasi,
              `${sNode.persentase.toFixed(2)}%`,
              sNode.sisa,
            ]);

            if (!filter.hideRekening) {
              sNode.rekeningNodes.forEach((rNode) => {
                rows.push([
                  rNode.rek.kode,
                  `        [Rekening] ${rNode.rek.nama}`,
                  rNode.pagu,
                  rNode.realisasi,
                  `${rNode.persentase.toFixed(2)}%`,
                  rNode.sisa,
                ]);
              });
            }
          });
        });
      });
    });

    rows.push([]);
    rows.push([
      'TOTAL',
      'TOTAL KESELURUHAN BIDANG',
      treeData.grandPagu,
      treeData.grandRealisasi,
      `${treeData.grandPersentase.toFixed(2)}%`,
      treeData.grandSisa,
    ]);

    exportTableToExcel(
      `REKAPITULASI BELANJA PER BIDANG HIRARKI TA ${selectedYear}`,
      headers,
      rows,
      `Rekap_Per_Bidang_${selectedYear}`
    );
  };

  // Export PDF
  const handleExportPdf = () => {
    const items: RekapBidangItemRow[] = [];

    treeData.bidangNodes.forEach((bNode) => {
      // 1. Bidang
      items.push({
        level: 'bidang',
        kode: bNode.bidang.kode,
        nama: bNode.bidang.nama,
        pagu: bNode.pagu,
        realisasi: bNode.realisasi,
        persentase: bNode.persentase,
        sisa: bNode.sisa,
      });

      // 2. Program
      bNode.programNodes.forEach((pNode) => {
        items.push({
          level: 'program',
          kode: pNode.program.kode,
          nama: pNode.program.nama,
          pagu: pNode.pagu,
          realisasi: pNode.realisasi,
          persentase: pNode.persentase,
          sisa: pNode.sisa,
        });

        // 3. Kegiatan
        pNode.kegiatanNodes.forEach((kNode) => {
          items.push({
            level: 'kegiatan',
            kode: kNode.kegiatan.kode,
            nama: kNode.kegiatan.nama,
            pagu: kNode.pagu,
            realisasi: kNode.realisasi,
            persentase: kNode.persentase,
            sisa: kNode.sisa,
          });

          // 4. Sub Kegiatan
          kNode.subNodes.forEach((sNode) => {
            items.push({
              level: 'sub',
              kode: sNode.sub.kode,
              nama: sNode.sub.nama,
              pagu: sNode.pagu,
              realisasi: sNode.realisasi,
              persentase: sNode.persentase,
              sisa: sNode.sisa,
            });

            // 5. Rekening
            if (!filter.hideRekening) {
              sNode.rekeningNodes.forEach((rNode) => {
                items.push({
                  level: 'rekening',
                  kode: rNode.rek.kode,
                  nama: rNode.rek.nama,
                  pagu: rNode.pagu,
                  realisasi: rNode.realisasi,
                  persentase: rNode.persentase,
                  sisa: rNode.sisa,
                });
              });
            }
          });
        });
      });
    });

    // Grand Total Row
    items.push({
      level: 'total',
      kode: 'TOTAL',
      nama: 'TOTAL KESELURUHAN BIDANG',
      pagu: treeData.grandPagu,
      realisasi: treeData.grandRealisasi,
      persentase: treeData.grandPersentase,
      sisa: treeData.grandSisa,
    });

    const activeBidangObj = bidangList.find(
      (b) => String(b.id) === String(filter.bidangId) || String(b.kode) === String(filter.bidangId)
    );

    const filterBidangText =
      filter.bidangId === 'all'
        ? 'Semua Bidang'
        : activeBidangObj
        ? `[${activeBidangObj.kode}] ${activeBidangObj.nama}`
        : 'Semua Bidang';

    const filterPeriodeText =
      filter.startDate || filter.endDate
        ? `${filter.startDate || 'Awal'} s/d ${filter.endDate || 'Akhir'}`
        : 'Semua Periode (1 Tahun)';

    const filterJenisText =
      filter.jenisBelanja === 'all'
        ? 'Semua Jenis Belanja'
        : `Jenis Belanja ${filter.jenisBelanja}`;

    exportRekapBidangHierarchyToPdf(items, {
      tahun: String(selectedYear),
      filterBidang: filterBidangText,
      filterPeriode: filterPeriodeText,
      filterJenisBelanja: filterJenisText,
      sembunyikanRekening: filter.hideRekening,
      grandPagu: treeData.grandPagu,
      grandRealisasi: treeData.grandRealisasi,
      grandSisa: treeData.grandSisa,
      grandPersentase: treeData.grandPersentase,
      filename: `Rekap_Per_Bidang_${selectedYear}`,
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5 font-heading">
            <Layers className="w-6 h-6 text-amber-600" />
            Rekapitulasi Belanja Per Bidang (Hirarki / Tree View)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Laporan hirarki berjenjang: Bidang &rarr; Program &rarr; Kegiatan &rarr; Sub Kegiatan &rarr; Rekening Belanja.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs rounded-2xl transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs rounded-2xl transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Box */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Filter className="w-4 h-4 text-sky-600" />
          Filter & Opsi Laporan Hirarki
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-600 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Dari Tanggal SPM
            </label>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-600 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Sampai Tanggal SPM
            </label>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-600">Pilih Bidang</label>
            <select
              value={filter.bidangId}
              onChange={(e) => setFilter({ ...filter, bidangId: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold cursor-pointer"
            >
              <option value="all">Semua Bidang</option>
              {bidangList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-600">Jenis Belanja</label>
            <select
              value={filter.jenisBelanja}
              onChange={(e) => setFilter({ ...filter, jenisBelanja: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold cursor-pointer"
            >
              <option value="all">Semua Jenis Belanja</option>
              <option value="UP">UP (Uang Persediaan)</option>
              <option value="GU">GU (Ganti Uang)</option>
              <option value="TU">TU (Tambah Uang)</option>
              <option value="LS">LS (Langsung)</option>
              <option value="Gaji dan Tunjangan">Gaji dan Tunjangan</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-600">Opsi Tampilan</label>
            <div className="p-2 bg-slate-50 border border-slate-300 rounded-xl flex items-center gap-2">
              <input
                type="checkbox"
                id="hideRekening"
                checked={filter.hideRekening}
                onChange={(e) => setFilter({ ...filter, hideRekening: e.target.checked })}
                className="w-4 h-4 text-amber-500 rounded cursor-pointer"
              />
              <label htmlFor="hideRekening" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1">
                {filter.hideRekening ? <EyeOff className="w-3.5 h-3.5 text-rose-600" /> : <Eye className="w-3.5 h-3.5 text-amber-600" />}
                Sembunyikan Rekening
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Hierarchy Tree Output */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between text-xs font-bold">
          <span>STRUKTUR HIRARKI REKAPITULASI BELANJA TA {selectedYear}</span>
          <span className="text-[11px] text-sky-300">
            Total Pagu: {formatRupiah(treeData.grandPagu)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200 text-[11px]">
                <th className="p-3 w-40">KODE</th>
                <th className="p-3 min-w-[300px]">URAIAN / NOMENKLATUR BELANJA</th>
                <th className="p-3 text-right min-w-[140px]">PAGU ANGGARAN</th>
                <th className="p-3 text-right min-w-[140px]">REALISASI SPM</th>
                <th className="p-3 text-center w-24">PERSEN (%)</th>
                <th className="p-3 text-right min-w-[140px]">SISA PAGU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {treeData.bidangNodes.map((bNode) => {
                const isExpanded = expandedNodes[bNode.bidang.id] !== false; // default open

                return (
                  <React.Fragment key={bNode.bidang.id}>
                    {/* Level 1: BIDANG */}
                    <tr
                      onClick={() => toggleNode(bNode.bidang.id)}
                      className="bg-slate-800 text-white font-bold hover:bg-slate-700 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-mono">{bNode.bidang.kode}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-sky-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-sky-400 shrink-0" />
                          )}
                          <span className="text-sm tracking-wide">
                            BIDANG: {bNode.bidang.nama.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right">{formatRupiah(bNode.pagu)}</td>
                      <td className="p-3 text-right text-sky-300 font-extrabold">
                        {formatRupiah(bNode.realisasi)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-sky-500/30 text-sky-200 rounded font-bold text-[11px]">
                          {bNode.persentase.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 text-right">{formatRupiah(bNode.sisa)}</td>
                    </tr>

                    {/* Level 2: PROGRAM */}
                    {isExpanded &&
                      bNode.programNodes.map((pNode) => (
                        <React.Fragment key={pNode.program.id}>
                          <tr className="bg-slate-100/90 text-slate-900 font-bold border-b border-slate-200">
                            <td className="p-3 font-mono pl-6 text-slate-600">{pNode.program.kode}</td>
                            <td className="p-3 pl-8">
                              <span className="text-sky-800 font-bold">Program: </span>
                              {pNode.program.nama}
                            </td>
                            <td className="p-3 text-right">{formatRupiah(pNode.pagu)}</td>
                            <td className="p-3 text-right text-sky-800 font-bold">
                              {formatRupiah(pNode.realisasi)}
                            </td>
                            <td className="p-3 text-center font-bold text-slate-700">
                              {pNode.persentase.toFixed(1)}%
                            </td>
                            <td className="p-3 text-right">{formatRupiah(pNode.sisa)}</td>
                          </tr>

                          {/* Level 3: KEGIATAN */}
                          {pNode.kegiatanNodes.map((kNode) => (
                            <React.Fragment key={kNode.kegiatan.id}>
                              <tr className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-100">
                                <td className="p-2.5 font-mono pl-8 text-slate-500">{kNode.kegiatan.kode}</td>
                                <td className="p-2.5 pl-12 text-slate-800">
                                  <span className="text-slate-500 font-bold">Kegiatan: </span>
                                  {kNode.kegiatan.nama}
                                </td>
                                <td className="p-2.5 text-right font-medium">{formatRupiah(kNode.pagu)}</td>
                                <td className="p-2.5 text-right text-sky-700 font-bold">
                                  {formatRupiah(kNode.realisasi)}
                                </td>
                                <td className="p-2.5 text-center text-slate-600">
                                  {kNode.persentase.toFixed(1)}%
                                </td>
                                <td className="p-2.5 text-right font-medium">{formatRupiah(kNode.sisa)}</td>
                              </tr>

                              {/* Level 4: SUB KEGIATAN */}
                              {kNode.subNodes.map((sNode) => (
                                <React.Fragment key={sNode.sub.id}>
                                  <tr className="bg-white text-slate-800 border-b border-slate-100">
                                    <td className="p-2 font-mono pl-10 text-slate-400 text-[11px]">
                                      {sNode.sub.kode}
                                    </td>
                                    <td className="p-2 pl-16 font-medium text-slate-800">
                                      <span className="text-slate-400">Sub: </span>
                                      {sNode.sub.nama}
                                    </td>
                                    <td className="p-2 text-right">{formatRupiah(sNode.pagu)}</td>
                                    <td className="p-2 text-right font-semibold text-sky-800">
                                      {formatRupiah(sNode.realisasi)}
                                    </td>
                                    <td className="p-2 text-center text-slate-500">
                                      {sNode.persentase.toFixed(1)}%
                                    </td>
                                    <td className="p-2 text-right">{formatRupiah(sNode.sisa)}</td>
                                  </tr>

                                  {/* Level 5: REKENING BELANJA (Optionally hidden) */}
                                  {!filter.hideRekening &&
                                    sNode.rekeningNodes.map((rNode) => (
                                      <tr
                                        key={rNode.rek.id}
                                        className="bg-sky-50/30 text-slate-700 italic border-b border-sky-100/50"
                                      >
                                        <td className="p-1.5 font-mono pl-12 text-sky-700 text-[10px]">
                                          {rNode.rek.kode}
                                        </td>
                                        <td className="p-1.5 pl-20 text-[11px]">
                                          <span className="font-semibold text-slate-600">
                                            {rNode.rek.nama}
                                          </span>
                                        </td>
                                        <td className="p-1.5 text-right text-[11px]">
                                          {formatRupiah(rNode.pagu)}
                                        </td>
                                        <td className="p-1.5 text-right font-bold text-sky-800 text-[11px]">
                                          {formatRupiah(rNode.realisasi)}
                                        </td>
                                        <td className="p-1.5 text-center text-[10px]">
                                          {rNode.persentase.toFixed(1)}%
                                        </td>
                                        <td className="p-1.5 text-right text-[11px]">
                                          {formatRupiah(rNode.sisa)}
                                        </td>
                                      </tr>
                                    ))}
                                </React.Fragment>
                              ))}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      ))}

                    {/* Total Per Bidang Row */}
                    <tr className="bg-sky-100/80 text-sky-950 font-extrabold border-b-2 border-sky-300">
                      <td className="p-3 font-mono" colSpan={2}>
                        TOTAL SUB BIDANG: {bNode.bidang.nama.toUpperCase()}
                      </td>
                      <td className="p-3 text-right">{formatRupiah(bNode.pagu)}</td>
                      <td className="p-3 text-right text-sky-900">{formatRupiah(bNode.realisasi)}</td>
                      <td className="p-3 text-center">{bNode.persentase.toFixed(1)}%</td>
                      <td className="p-3 text-right">{formatRupiah(bNode.sisa)}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>

            {/* Total Keseluruhan Bidang Footer */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-extrabold text-sm">
                <td className="p-4" colSpan={2}>
                  TOTAL KESELURUHAN SELURUH BIDANG
                </td>
                <td className="p-4 text-right">{formatRupiah(treeData.grandPagu)}</td>
                <td className="p-4 text-right text-sky-300">{formatRupiah(treeData.grandRealisasi)}</td>
                <td className="p-4 text-center">{treeData.grandPersentase.toFixed(1)}%</td>
                <td className="p-4 text-right text-emerald-300">{formatRupiah(treeData.grandSisa)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
