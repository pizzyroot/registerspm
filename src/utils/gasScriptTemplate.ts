export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * GOOGLE APPS SCRIPT BACKEND FOR REGISTER SPM & REKAPITULASI BELANJA
 * 
 * CARA PENGGUNAAN:
 * 1. Buka Google Spreadsheet baru di Google Drive Anda.
 * 2. Klik menu Extensi (Extensions) > Apps Script.
 * 3. Hapus semua kode default, lalu Paste seluruh kode ini.
 * 4. Klik "Simpan" (Icon Diskette).
 * 5. Jalankan fungsi "setupDatabaseSheets" sekali untuk membuat sheet & header otomatis.
 * 6. Klik "Terapkan" (Deploy) > "Terapkan sebagai Aplikasi Web" (New Deployment).
 * 7. Pada "Siapa yang memiliki akses" (Who has access), pilih: "SIAPA SAJA" (Anyone).
 * 8. Klik Deploy, Berikan Izin Akun, lalu Copy "URL Aplikasi Web" (Web App URL).
 * 9. Paste URL tersebut di aplikasi ini pada menu Master Data > Integrasi Spreadsheet.
 */

function setupDatabaseSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = {
    "bidang": ["id", "kode", "nama"],
    "program": ["id", "bidangId", "kode", "nama"],
    "kegiatan": ["id", "programId", "kode", "nama"],
    "subkegiatan": ["id", "kegiatanId", "kode", "nama"],
    "rekening": ["id", "subKegiatanId", "kode", "nama", "pagu", "tahun"],
    "spm": ["id", "nomorSpm", "tanggalSpm", "jenisBelanja", "bidangId", "kontrakId", "uraianPekerjaan", "persentaseFisik", "realisasiSpm", "pajakJson", "rincianJson", "tahun"],
    "kontrak": ["id", "bidangId", "uraian", "namaPenyedia", "nomorKontrak", "tanggalMulai", "tanggalBerakhir", "nilaiKontrak", "persentaseFisik", "tahun"],
    "jurnal_belanja": ["id", "nomorJurnal", "tanggal", "bidangId", "rekeningAsalId", "rekeningTujuanId", "jumlah", "rincianAsalJson", "rincianTujuanJson", "keterangan", "tahun"],
    "pengembalian_belanja": ["id", "nomorSts", "tanggal", "keterangan", "totalNilai", "rincianJson", "tahun"],
    "user": ["username", "passwordHash", "namaLengkap", "jabatan", "role"]
  };

  for (var name in sheets) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(sheets[name]);
      sheet.getRange(1, 1, 1, sheets[name].length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    }
  }
}

function doGet(e) {
  try {
    setupDatabaseSheets();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var result = {
      status: "success",
      timestamp: new Date().toISOString(),
      data: {
        bidang: readSheet(ss, "bidang"),
        program: readSheet(ss, "program"),
        kegiatan: readSheet(ss, "kegiatan"),
        subkegiatan: readSheet(ss, "subkegiatan"),
        rekening: readSheet(ss, "rekening"),
        spm: readSpmSheet(ss),
        kontrak: readSheet(ss, "kontrak"),
        jurnal_belanja: readJurnalSheet(ss),
        pengembalian_belanja: readPengembalianSheet(ss),
        user: readSheet(ss, "user")
      }
    };
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    setupDatabaseSheets();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var contents = JSON.parse(e.postData.contents);
    var action = contents.action;
    var payload = contents.data;

    if (action === "sync_all" && payload) {
      if (payload.bidang) writeSheet(ss, "bidang", ["id", "kode", "nama"], payload.bidang);
      if (payload.program) writeSheet(ss, "program", ["id", "bidangId", "kode", "nama"], payload.program);
      if (payload.kegiatan) writeSheet(ss, "kegiatan", ["id", "programId", "kode", "nama"], payload.kegiatan);
      if (payload.subkegiatan) writeSheet(ss, "subkegiatan", ["id", "kegiatanId", "kode", "nama"], payload.subkegiatan);
      if (payload.rekening) writeSheet(ss, "rekening", ["id", "subKegiatanId", "kode", "nama", "pagu", "tahun"], payload.rekening);
      if (payload.kontrak) writeSheet(ss, "kontrak", ["id", "bidangId", "uraian", "namaPenyedia", "nomorKontrak", "tanggalMulai", "tanggalBerakhir", "nilaiKontrak", "persentaseFisik", "tahun"], payload.kontrak);
      if (payload.jurnal_belanja) writeJurnalSheet(ss, payload.jurnal_belanja);
      if (payload.pengembalian_belanja) writePengembalianSheet(ss, payload.pengembalian_belanja);
      if (payload.user) writeSheet(ss, "user", ["username", "passwordHash", "namaLengkap", "jabatan", "role"], payload.user);
      if (payload.spm) writeSpmSheet(ss, payload.spm);

      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data berhasil disimpan ke Google Spreadsheet!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Action tidak dikenal" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetCaseInsensitive(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (sheet) return sheet;
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().toLowerCase().trim() === sheetName.toLowerCase().trim()) {
      return sheets[i];
    }
  }
  return null;
}

function readSheet(ss, sheetName) {
  var sheet = getSheetCaseInsensitive(ss, sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var rows = [];
  var tz = ss.getSpreadsheetTimeZone();
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    var hasContent = false;
    for (var j = 0; j < headers.length; j++) {
      var headerKey = String(headers[j] || "").trim();
      if (headerKey) {
        var val = data[i][j];
        if (val !== "" && val !== null && val !== undefined) {
          hasContent = true;
          if (Object.prototype.toString.call(val) === '[object Date]' || (val && typeof val.getFullYear === 'function')) {
            val = Utilities.formatDate(val, tz, "dd-MM-yyyy");
          }
        }
        obj[headerKey] = val;
      }
    }
    if (hasContent) {
      rows.push(obj);
    }
  }
  return rows;
}

function formatToDdMmYyyy(valStr) {
  if (!valStr) return "";
  var str = String(valStr).trim();
  if (/^\\d{2}-\\d{2}-\\d{4}$/.test(str)) return str;
  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(str)) {
    var parts = str.split("-");
    return parts[2] + "-" + parts[1] + "-" + parts[0];
  }
  return str;
}

function readSpmSheet(ss) {
  var rawRows = readSheet(ss, "spm");
  return rawRows.map(function(item) {
    var rawPajak = item.pajakJson || item.pajak_json || item.pajakJsonStr || item.pajak || "";
    var rawRincian = item.rincianJson || item.rincian_json || item.rincianJsonStr || item.rincianBelanja || item.rincian || "";
    
    try {
      if (typeof rawPajak === "string" && rawPajak.trim().length > 0) {
        item.pajak = JSON.parse(rawPajak);
      } else if (typeof rawPajak === "object" && rawPajak !== null) {
        item.pajak = rawPajak;
      } else {
        item.pajak = { ppn:0, pph21:0, pph22:0, pph23:0, pphPasal4:0 };
      }
    } catch(e) {
      item.pajak = { ppn:0, pph21:0, pph22:0, pph23:0, pphPasal4:0 };
    }

    try {
      if (typeof rawRincian === "string" && rawRincian.trim().length > 0) {
        item.rincianBelanja = JSON.parse(rawRincian);
      } else if (Array.isArray(rawRincian)) {
        item.rincianBelanja = rawRincian;
      } else {
        item.rincianBelanja = [];
      }
    } catch(e) {
      item.rincianBelanja = [];
    }

    delete item.pajakJson;
    delete item.rincianJson;
    return item;
  });
}

function readJurnalSheet(ss) {
  var rawRows = readSheet(ss, "jurnal_belanja");
  return rawRows.map(function(item) {
    var rawAsal = item.rincianAsalJson || item.rincian_asal_json || item.rincianAsal || "";
    var rawTujuan = item.rincianTujuanJson || item.rincian_tujuan_json || item.rincianTujuan || "";

    try {
      if (typeof rawAsal === "string" && rawAsal.trim().length > 0) {
        item.rincianAsal = JSON.parse(rawAsal);
      } else if (Array.isArray(rawAsal)) {
        item.rincianAsal = rawAsal;
      } else {
        item.rincianAsal = [];
      }
    } catch(e) {
      item.rincianAsal = [];
    }

    try {
      if (typeof rawTujuan === "string" && rawTujuan.trim().length > 0) {
        item.rincianTujuan = JSON.parse(rawTujuan);
      } else if (Array.isArray(rawTujuan)) {
        item.rincianTujuan = rawTujuan;
      } else {
        item.rincianTujuan = [];
      }
    } catch(e) {
      item.rincianTujuan = [];
    }

    delete item.rincianAsalJson;
    delete item.rincianTujuanJson;
    return item;
  });
}

function writeSheet(ss, sheetName, headers, items) {
  var sheet = getSheetCaseInsensitive(ss, sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  sheet.clear();
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
  
  if (items && items.length > 0) {
    var rows = items.map(function(item) {
      return headers.map(function(h) {
        var val = item[h] !== undefined && item[h] !== null ? item[h] : "";
        if (h === "tanggalMulai" || h === "tanggalBerakhir" || h === "tanggalSpm" || h === "tanggal") {
          val = formatToDdMmYyyy(val);
        }
        return val;
      });
    });
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function writeSpmSheet(ss, items) {
  var headers = ["id", "nomorSpm", "tanggalSpm", "jenisBelanja", "bidangId", "kontrakId", "uraianPekerjaan", "persentaseFisik", "realisasiSpm", "pajakJson", "rincianJson", "tahun"];
  var transformed = items.map(function(item) {
    return {
      id: item.id,
      nomorSpm: item.nomorSpm,
      tanggalSpm: formatToDdMmYyyy(item.tanggalSpm),
      jenisBelanja: item.jenisBelanja,
      bidangId: item.bidangId,
      kontrakId: item.kontrakId || "",
      uraianPekerjaan: item.uraianPekerjaan,
      persentaseFisik: item.persentaseFisik || 0,
      realisasiSpm: item.realisasiSpm || 0,
      pajakJson: JSON.stringify(item.pajak || {}),
      rincianJson: JSON.stringify(item.rincianBelanja || []),
      tahun: item.tahun
    };
  });
  writeSheet(ss, "spm", headers, transformed);
}

function writeJurnalSheet(ss, items) {
  var headers = ["id", "nomorJurnal", "tanggal", "bidangId", "rekeningAsalId", "rekeningTujuanId", "jumlah", "rincianAsalJson", "rincianTujuanJson", "keterangan", "tahun"];
  var transformed = items.map(function(item) {
    var firstAsal = (item.rincianAsal && item.rincianAsal.length > 0) ? item.rincianAsal[0].rekeningId : (item.rekeningAsalId || "");
    var firstTujuan = (item.rincianTujuan && item.rincianTujuan.length > 0) ? item.rincianTujuan[0].rekeningId : (item.rekeningTujuanId || "");

    return {
      id: item.id,
      nomorJurnal: item.nomorJurnal,
      tanggal: formatToDdMmYyyy(item.tanggal),
      bidangId: item.bidangId,
      rekeningAsalId: firstAsal,
      rekeningTujuanId: firstTujuan,
      jumlah: item.jumlah || 0,
      rincianAsalJson: JSON.stringify(item.rincianAsal || []),
      rincianTujuanJson: JSON.stringify(item.rincianTujuan || []),
      keterangan: item.keterangan || "",
      tahun: item.tahun
    };
  });
  writeSheet(ss, "jurnal_belanja", headers, transformed);
}

function readPengembalianSheet(ss) {
  var rawRows = readSheet(ss, "pengembalian_belanja");
  return rawRows.map(function(item) {
    var rawRincian = item.rincianJson || item.rincian_json || item.rincianPengembalian || "";

    try {
      if (typeof rawRincian === "string" && rawRincian.trim().length > 0) {
        item.rincianPengembalian = JSON.parse(rawRincian);
      } else if (Array.isArray(rawRincian)) {
        item.rincianPengembalian = rawRincian;
      } else {
        item.rincianPengembalian = [];
      }
    } catch(e) {
      item.rincianPengembalian = [];
    }

    delete item.rincianJson;
    return item;
  });
}

function writePengembalianSheet(ss, items) {
  var headers = ["id", "nomorSts", "tanggal", "keterangan", "totalNilai", "rincianJson", "tahun"];
  var transformed = items.map(function(item) {
    return {
      id: item.id,
      nomorSts: item.nomorSts,
      tanggal: formatToDdMmYyyy(item.tanggal),
      keterangan: item.keterangan || "",
      totalNilai: item.totalNilai || 0,
      rincianJson: JSON.stringify(item.rincianPengembalian || []),
      tahun: item.tahun
    };
  });
  writeSheet(ss, "pengembalian_belanja", headers, transformed);
}
`;
