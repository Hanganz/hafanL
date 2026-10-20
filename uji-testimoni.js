// node uji-testimoni.js  (SQLite sebagai pengganti MySQL, memakai ../schema.sql)
const fs = require('fs'), path = require('path'), { DatabaseSync } = require('node:sqlite');
const { kirim, daftarTampil, atur } = require('./testimoni-core');
let sch = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8').replace(/--.*$/gm, '').replace(/SET NAMES[^;]*;/g, '').replace(/\) ENGINE=[^;]*;/g, ');').replace(/\s+UNSIGNED/g, '').replace(/\s+AUTO_INCREMENT/g, '').replace(/ENUM\([^)]*\)/g, 'TEXT').replace(/DATETIME\(3\)/g, 'TEXT').replace(/CURRENT_TIMESTAMP\(3\)/g, 'CURRENT_TIMESTAMP').replace(/TINYINT\(1\)/g, 'INTEGER').replace(/MEDIUMTEXT/g, 'TEXT').replace(/UNIQUE KEY \w+ \(/g, 'UNIQUE (').replace(/^\s*KEY \w+ \([^)]*\),?\s*$/gm, '');
sch = sch.replace(/^\s*id (?:INT|BIGINT) NOT NULL,/gm, '  id INTEGER PRIMARY KEY,').replace(/^\s*PRIMARY KEY \(id\),?\s*$/gm, '').replace(/,(\s*\n\s*\))/g, '$1');
const raw = new DatabaseSync(':memory:'); raw.exec('PRAGMA foreign_keys=ON;'); raw.exec(sch);
const db = { all: async (s, p = []) => raw.prepare(s).all(...p), run: async (s, p = []) => ({ insertId: Number(raw.prepare(s).run(...p).lastInsertRowid) }), tx: async fn => { raw.exec('BEGIN'); try { const r = await fn(db); raw.exec('COMMIT'); return r; } catch (e) { raw.exec('ROLLBACK'); throw e; } } };
let gagal = 0; const cek = (n, ok, i) => { console.log((ok ? '  ok  ' : 'GAGAL ') + n + (i ? ' -> ' + i : '')); if (!ok) gagal++; };
(async () => {
  raw.exec("INSERT INTO pelanggan (kode,nama,no_wa) VALUES ('CUST0001','A','6281')");
  const ps = (no, st) => raw.prepare("INSERT INTO pesanan (no_nota,kode_lacak,pelanggan_id,status,total) VALUES (?,?,?,?,?)").run(no, 'K' + no, 1, st, 10000);
  ['selesai', 'diambil', 'diproses'].forEach((s, i) => ps('N' + (i + 1), s));
  for (let i = 4; i <= 9; i++) ps('N' + i, 'selesai');
  const ok = { nama: 'Budi', bintang: 5, isi: 'Cucian wangi dan rapi, terima kasih.', ip: '1.1.1.1' };
  let r = await kirim(db, { ...ok, kode: 'kn1' });
  cek('ulasan dari pesanan selesai langsung tampil (kode huruf kecil pun boleh)', r.ok && (await daftarTampil(db)).length === 1, JSON.stringify(r));
  r = await kirim(db, { ...ok, kode: 'KN1' }); cek('satu pesanan hanya boleh satu ulasan', !r.ok && /sudah punya/.test(r.alasan));
  r = await kirim(db, { ...ok, kode: 'KN3' }); cek('pesanan belum selesai ditolak', !r.ok && /selesai/.test(r.alasan));
  r = await kirim(db, { ...ok, kode: 'XXXXXX' }); cek('kode tidak dikenal ditolak', !r.ok);
  r = await kirim(db, { ...ok, kode: 'KN2' }); cek('pesanan yang sudah diambil boleh', r.ok);
  for (const [n, isi] of [['tautan', 'bagus cek www.promo.com'], ['nomor telepon', 'hubungi 0812 3456 7890 ya'], ['kata kasar', 'pelayanan anjing banget'], ['kata kasar disamarkan', 'a.n.j.i.n.g parah'], ['huruf berulang', 'bagusssssssssssss sekali'], ['terlalu pendek', 'ok']]) {
    r = await kirim(db, { ...ok, kode: 'KN4', isi }); cek('ditolak: ' + n, !r.ok, r.alasan);
  }
  r = await kirim(db, { ...ok, kode: 'KN4', bintang: 6 }); cek('bintang di luar 1-5 ditolak', !r.ok);
  r = await kirim(db, { ...ok, kode: 'KN4', isi: '<script>alert(1)</script> mantap sekali ya' }); const row = raw.prepare('SELECT isi FROM testimoni WHERE id=?').get(r.id || 0);
  cek('tanda < > dibersihkan sebelum disimpan', r.ok && !/[<>]/.test(row.isi), row && row.isi);
  let lolos = 0; for (let i = 5; i <= 9; i++) { const x = await kirim(db, { ...ok, kode: 'KN' + i, ip: '9.9.9.9' }, { maksPerHari: 2 }); if (x.ok) lolos++; }
  cek('batas per hari per perangkat (2 lolos dari 5 percobaan)', lolos === 2, lolos + ' lolos');
  const id = (await daftarTampil(db))[0].id; await atur(db, id, false);
  cek('pemilik bisa menyembunyikan ulasan dan hilang dari halaman', !(await daftarTampil(db)).some(x => x.id === id));
  await atur(db, id, true); cek('dan bisa ditampilkan lagi', (await daftarTampil(db)).some(x => x.id === id));
  cek('daftar publik tidak membocorkan ip_hash / pesanan_id', !('ip_hash' in (await daftarTampil(db))[0]) && !('pesanan_id' in (await daftarTampil(db))[0]));
  console.log(gagal ? '\n' + gagal + ' pengujian GAGAL' : '\nSemua pengujian LULUS'); process.exit(gagal ? 1 : 0);
})();
