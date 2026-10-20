// Menguji mutasi-core dengan SQLite (bawaan Node) memakai ../schema.sql. SQLite bukan MySQL: uji ulang di MySQL sungguhan.
// Pakai: node uji-webhook.js
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { DatabaseSync } = require('node:sqlite');
const { cekTandaTangan, petakan, terima } = require('./mutasi-core');
let sch = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8').replace(/--.*$/gm, '').replace(/SET NAMES[^;]*;/g, '').replace(/\) ENGINE=[^;]*;/g, ');').replace(/\s+UNSIGNED/g, '').replace(/\s+AUTO_INCREMENT/g, '').replace(/ENUM\([^)]*\)/g, 'TEXT').replace(/DATETIME\(3\)/g, 'TEXT').replace(/CURRENT_TIMESTAMP\(3\)/g, 'CURRENT_TIMESTAMP').replace(/TINYINT\(1\)/g, 'INTEGER').replace(/MEDIUMTEXT/g, 'TEXT').replace(/UNIQUE KEY \w+ \(/g, 'UNIQUE (').replace(/^\s*KEY \w+ \([^)]*\),?\s*$/gm, '');
sch = sch.replace(/^\s*id (?:INT|BIGINT) NOT NULL,/gm, '  id INTEGER PRIMARY KEY,').replace(/^\s*PRIMARY KEY \(id\),?\s*$/gm, '');
sch = sch.replace(/,(\s*\n\s*\))/g, '$1');
const raw = new DatabaseSync(':memory:'); raw.exec('PRAGMA foreign_keys=ON;'); raw.exec(sch);
const db = { all: async (s, p = []) => raw.prepare(s).all(...p), run: async (s, p = []) => ({ insertId: Number(raw.prepare(s).run(...p).lastInsertRowid) }), tx: async fn => { raw.exec('BEGIN'); try { const r = await fn(db); raw.exec('COMMIT'); return r; } catch (e) { raw.exec('ROLLBACK'); throw e; } } };
let gagal = 0; const cek = (n, ok, i) => { console.log((ok ? '  ok  ' : 'GAGAL ') + n + (i ? ' -> ' + i : '')); if (!ok) gagal++; };
(async () => {
  raw.exec("INSERT INTO pelanggan (kode,nama,no_wa) VALUES ('CUST0001','A','6281'),('CUST0002','B','6282')");
  const ps = (no, pel, total, st) => raw.prepare("INSERT INTO pesanan (no_nota,kode_lacak,pelanggan_id,status,total) VALUES (?,?,?,?,?)").run(no, 'K' + no, pel, st || 'diproses', total);
  ps('N1', 1, 25137); ps('N2', 1, 40000); ps('N3', 2, 40000); ps('N4', 2, 77000, 'dibatalkan');
  const sisa = n => raw.prepare("SELECT v.sisa s FROM v_tagihan v JOIN pesanan p ON p.id=v.pesanan_id WHERE p.no_nota=?").get(n).s;
  const mut = (id, jumlah, tipe = 'credit') => ({ id, waktu: '2026-10-12T03:04:05Z', jumlah, tipe, ket: 'TRF dari Budi' });

  let r = await terima(db, 'mutasiku', mut('M1', 25137));
  cek('nominal unik -> otomatis lunas', r.status === 'dicocokkan' && sisa('N1') === 0, JSON.stringify(r));
  r = await terima(db, 'mutasiku', mut('M1', 25137));
  cek('kiriman ulang (id sama) tidak menggandakan pembayaran', r.status === 'duplikat' && raw.prepare('SELECT COUNT(*) c FROM pembayaran').get().c === 1);
  r = await terima(db, 'mutasiku', mut('M2', 40000));
  cek('dua pesanan sisa sama -> JANGAN ditebak', r.status === 'baru' && /lebih dari satu/.test(r.alasan) && sisa('N2') === 40000 && sisa('N3') === 40000);
  r = await terima(db, 'mutasiku', mut('M3', 12345));
  cek('tidak ada yang cocok -> disimpan saja', r.status === 'baru' && /tidak ada/.test(r.alasan));
  r = await terima(db, 'mutasiku', mut('M4', 77000));
  cek('pesanan dibatalkan tidak dicocokkan', r.status === 'baru');
  r = await terima(db, 'mutasiku', mut('M5', 9000, 'debit'));
  cek('uang keluar diabaikan', r.status === 'diabaikan' && raw.prepare("SELECT COUNT(*) c FROM mutasi_bank WHERE id_eksternal='M5'").get().c === 0);
  r = await terima(db, 'mutasiku', mut('M6', -5));
  cek('jumlah tidak valid ditolak', r.status === 'ditolak');
  r = await terima(db, 'mutasiku', { id: 'M7', waktu: 'bukan tanggal', jumlah: 1000, tipe: 'credit' });
  cek('waktu tidak valid ditolak', r.status === 'ditolak');
  const st = raw.prepare("SELECT status,pesanan_id,pembayaran_id FROM mutasi_bank WHERE id_eksternal='M1'").get();
  cek('mutasi tercatat menaut ke pesanan dan pembayaran', st.status === 'dicocokkan' && st.pesanan_id === 1 && st.pembayaran_id === 1);
  const mentah = JSON.stringify([mut('X', 1)]), sig = crypto.createHmac('sha256', 'rahasia').update(mentah).digest('hex');
  cek('tanda tangan HMAC benar diterima', cekTandaTangan(mentah, 'rahasia', sig) && cekTandaTangan(mentah, 'rahasia', 'sha256=' + sig.toUpperCase()));
  cek('tanda tangan salah / kosong / badan diubah ditolak', !cekTandaTangan(mentah, 'rahasia', 'abc') && !cekTandaTangan(mentah, 'rahasia', '') && !cekTandaTangan(mentah + ' ', 'rahasia', sig) && !cekTandaTangan(mentah, '', sig));
  cek('mode token', cekTandaTangan('x', 'tok123', 'tok123', 'token') && !cekTandaTangan('x', 'tok123', 'tok124', 'token'));
  const p = petakan({ data: [{ id: 7, date: '2026-10-12 10:00:00', amount: '25000', type: 'CR', description: 'x' }] });
  r = await terima(db, 'mutasiku', p[0]);
  cek('pemetaan payload berbentuk {data:[...]} dan tipe huruf besar', p.length === 1 && r.status === 'baru');
  console.log(gagal ? '\n' + gagal + ' pengujian GAGAL' : '\nSemua pengujian LULUS'); process.exit(gagal ? 1 : 0);
})();
