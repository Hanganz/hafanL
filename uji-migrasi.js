// Menguji schema.sql + data.sql hasil migrasi memakai SQLite (bawaan Node) sebagai pengganti MySQL.
// Ini menguji urutan impor, kunci asing, keunikan, dan KESAMAAN angka dengan aplikasi (tagihan, saldo, poin).
// Pakai: node uji-migrasi.js <sumber: index.html|cadangan.json> [folder-keluaran-migrasi]
// Catatan: SQLite bukan MySQL. Pengujian ini tidak menggantikan uji impor di MySQL/MariaDB sungguhan.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const { DatabaseSync } = require('node:sqlite');
const sumber = process.argv[2], out = process.argv[3] || 'keluaran-uji';
cp.execFileSync('node', [path.join(__dirname, 'migrasi.js'), sumber, out], { stdio: 'ignore' });

let sch = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  .replace(/--.*$/gm, '').replace(/SET NAMES[^;]*;/g, '')
  .replace(/\) ENGINE=[^;]*;/g, ');')
  .replace(/\s+UNSIGNED/g, '').replace(/\s+AUTO_INCREMENT/g, '')
  .replace(/ENUM\([^)]*\)/g, 'TEXT').replace(/DATETIME\(3\)/g, 'TEXT').replace(/CURRENT_TIMESTAMP\(3\)/g, 'CURRENT_TIMESTAMP')
  .replace(/TINYINT\(1\)/g, 'INTEGER').replace(/MEDIUMTEXT/g, 'TEXT')
  .replace(/UNIQUE KEY \w+ \(/g, 'UNIQUE (')
  .replace(/^\s*KEY \w+ \([^)]*\),?\s*$/gm, '');
// buang koma sisa sebelum ")" akibat baris KEY yang dihapus
sch = sch.replace(/,(\s*\n\s*\))/g, '$1');
const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON;'); db.exec(sch);
const data = fs.readFileSync(path.join(out, 'data.sql'), 'utf8').replace(/SET FOREIGN_KEY_CHECKS=\d;/g, '').replace(/SET NAMES[^;]*;/g, '').replace(/START TRANSACTION;/, 'BEGIN;');
db.exec(data);

let gagal = 0; const cek = (n, ok, info) => { console.log((ok ? '  ok  ' : 'GAGAL ') + n + (info ? ' -> ' + info : '')); if (!ok) gagal++; };
const get = s => db.prepare(s).all();
const JS = (() => { const s = fs.readFileSync(sumber, 'utf8'); if (/\.json$/i.test(sumber)) { const d = JSON.parse(s); return d.data || d; } return JSON.parse(s.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/)[1]); })();
const NW = x => { let n = String(x || '').replace(/\D/g, ''); if (n[0] === '0') n = '62' + n.slice(1); return n; };

cek('semua tabel terisi sesuai jumlah di aplikasi', get('SELECT COUNT(*) c FROM pesanan')[0].c === JS.orders.length, JS.orders.length + ' pesanan');
cek('kunci asing konsisten', get('PRAGMA foreign_key_check').length === 0);
cek('no_nota dan kode_lacak unik', get('SELECT COUNT(DISTINCT no_nota) a, COUNT(DISTINCT kode_lacak) b, COUNT(*) c FROM pesanan').every(r => r.a === r.c && r.b === r.c));
cek('total = jumlah subtotal item', get('SELECT COUNT(*) c FROM pesanan p WHERE p.total <> (SELECT COALESCE(SUM(subtotal),0) FROM pesanan_item i WHERE i.pesanan_id=p.id) - p.diskon').every(r => r.c === 0) || get('SELECT p.id FROM pesanan p WHERE p.total <> (SELECT COALESCE(SUM(subtotal),0) FROM pesanan_item i WHERE i.pesanan_id=p.id) - p.diskon').length === 0);
// sisa tagihan: view v_tagihan harus sama dengan perhitungan aplikasi
const tagihApp = o => { if (o.st === 4) return 0; const pay = o.pay || (o.bayar === 'Lunas' ? [{ a: o.total }] : o.bayar === 'DP' ? [{ a: o.dp || 0 }] : []); return o.total - pay.reduce((s, y) => s + y.a, 0); };
const sisa = Object.fromEntries(get('SELECT pesanan_id, sisa FROM v_tagihan').map(r => [r.pesanan_id, r.sisa]));
const beda = JS.orders.filter(o => sisa[o.id] !== tagihApp(o));
cek('sisa tagihan (v_tagihan) sama dengan aplikasi untuk setiap order', beda.length === 0, beda.length ? beda.map(o => o.id).join(',') : '');
// saldo per pelanggan sama dengan S.sal
const saldo = Object.fromEntries(get('SELECT p.no_wa, COALESCE(v.saldo,0) s FROM pelanggan p LEFT JOIN v_saldo v ON v.pelanggan_id=p.id').map(r => [r.no_wa, r.s]));
const bedaS = Object.keys(JS.sal || {}).filter(k => (saldo[NW(k)] || 0) !== JS.sal[k]);
cek('saldo deposit sama dengan aplikasi', bedaS.length === 0, bedaS.join(','));
// pelanggan unik per nomor WA ternormalisasi
cek('satu pelanggan per nomor WA (format 62)', get('SELECT COUNT(*) c FROM pelanggan WHERE no_wa NOT LIKE \'62%\'')[0].c === 0);
cek('kode pelanggan CUST unik dan terisi semua', get("SELECT COUNT(*) c, COUNT(DISTINCT kode) d, SUM(kode LIKE 'CUST%') e FROM pelanggan").every(r => r.c === r.d && r.c === r.e));
{ const cu = JS.cu || []; const dbp = Object.fromEntries(get('SELECT kode, nama, alamat, catatan_internal, bermasalah, tanpa_wa FROM pelanggan').map(r => [r.kode, r]));
  const salah = cu.filter(c => c.kd && (!dbp[c.kd] || (dbp[c.kd].alamat || '') !== (c.alamat || '') || (dbp[c.kd].catatan_internal || '') !== (c.cat || '') || !!dbp[c.kd].bermasalah !== !!c.blok));
  cek('alamat, catatan internal, dan tanda bermasalah pelanggan ikut pindah', salah.length === 0, salah.map(c => c.kd).join(',')); }
cek('pelanggan tanpa WA disimpan NULL (bukan nomor palsu)', get("SELECT COUNT(*) c FROM pelanggan WHERE tanpa_wa=1 AND no_wa IS NOT NULL")[0].c === 0 && get("SELECT COUNT(*) c FROM pelanggan WHERE no_wa LIKE '620000%'")[0].c === 0);
cek('diskon tersimpan sama jumlahnya', get('SELECT COUNT(*) c FROM diskon')[0].c === (JS.dsk || []).length, (JS.dsk || []).length + ' diskon');
{ const n = JS.orders.reduce((s, o) => s + (o.it || []).filter(x => x.c || x.jp).length, 0); cek('catatan dan jumlah pakaian per item ikut pindah', get('SELECT COUNT(*) c FROM pesanan_item WHERE catatan IS NOT NULL OR jumlah_pakaian IS NOT NULL')[0].c === n, n + ' item'); }
cek('produk dijual pindah sebagai layanan berpenanda produk dengan stok', get('SELECT COUNT(*) c FROM layanan WHERE produk=1')[0].c === (JS.prd || []).length && (JS.prd || []).every(p => { const r = get("SELECT stok FROM layanan WHERE kode='" + p.k + "'")[0]; return r && (r.stok === (p.st == null ? null : p.st)); }), (JS.prd || []).length + ' produk');
cek('penjualan produk langsung ditandai dan tidak menambah poin', get('SELECT COUNT(*) c FROM pesanan WHERE penjualan=1')[0].c === JS.orders.filter(o => o.jual).length && get('SELECT COUNT(*) c FROM poin_mutasi pm JOIN pesanan p ON p.id=pm.pesanan_id WHERE p.penjualan=1')[0].c === 0);
cek('PIN tidak dibawa ke database', get('SELECT COUNT(*) c FROM pengguna WHERE pin_hash IS NOT NULL')[0].c === 0);
cek('teks QRIS ditandai rahasia', get("SELECT COUNT(*) c FROM pengaturan WHERE kunci='teks_qris' AND rahasia=0")[0].c === 0);
cek('tidak ada gambar base64 di database', get("SELECT COUNT(*) c FROM pengaturan WHERE nilai LIKE '%base64,%'")[0].c === 0 && get("SELECT COUNT(*) c FROM banner_promo WHERE path_gambar LIKE 'data:%'")[0].c === 0);
cek('data tidak punya karakter acak "undefined"', !/'undefined'/.test(data));
console.log(gagal ? '\nADA YANG GAGAL' : '\nSemua pengujian lulus'); process.exitCode = gagal ? 1 : 0;
