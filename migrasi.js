#!/usr/bin/env node
// Mengubah data aplikasi Kasir Laundry (file cadangan JSON atau index.html) menjadi data.sql + folder uploads/.
// Pakai:  node migrasi.js cadangan.json [folder-keluaran]
//         node migrasi.js index.html    [folder-keluaran]
// Jalankan di KOMPUTER SENDIRI. Hasilnya berisi data pelanggan: jangan dibagikan.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const [, , input, outDir = 'keluaran'] = process.argv;
if (!input) { console.error('Pemakaian: node migrasi.js cadangan.json|index.html [folder-keluaran]'); process.exit(1); }

function muat(f) {
  const s = fs.readFileSync(f, 'utf8');
  if (/\.json$/i.test(f)) { const d = JSON.parse(s); return d.data || d; }
  const m = s.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('Data tidak ditemukan di berkas HTML'); return JSON.parse(m[1]);
}
const S = muat(input);
const NW = x => { let n = String(x || '').replace(/\D/g, ''); if (n[0] === '0') n = '62' + n.slice(1); return n; };
const waktu = ms => ms ? new Date(ms).toISOString().replace('T', ' ').replace('Z', '') : null;
const q = v => v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(Math.round(v * 100) / 100) : "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
const sql = [];
const ins = (t, row) => { const c = Object.keys(row); sql.push(`INSERT INTO ${t} (${c.join(',')}) VALUES (${c.map(k => q(row[k])).join(',')});`); };
const H = (t, n) => sql.push(`-- ${t}${n !== undefined ? ' (' + n + ')' : ''}`);

// ---- normalisasi order (sama seperti migrate() di aplikasi) ----
const legacyPay = o => { const pd = o.bayar === 'Lunas' ? o.total : o.bayar === 'DP' ? (o.dp || 0) : 0; return pd > 0 ? [{ t: o.masuk, a: pd, m: o.met || 'Tunai', n: 'Data awal', by: o.pj || 'Admin' }] : []; };
const ordersAsli = (S.orders || []).slice().sort((a, b) => a.id - b.id);
const items = o => (o.it && o.it.length) ? o.it : [{ sv: o.sv, qty: o.qty, hs: o.hs || 0 }];
const STATUS = ['diterima', 'diproses', 'selesai', 'diambil', 'dibatalkan'];
const METODE = { Tunai: 'tunai', Transfer: 'transfer', QRIS: 'qris', Saldo: 'saldo' };

// ---- pengguna ----
const uid = {}; let nu = 0;
const peringatan = []; const hpDipakai = new Set();
const hpUnik = (hp, nama) => { const n = hp ? NW(hp) : null; if (!n) return null; if (hpDipakai.has(n)) { peringatan.push(`Nomor HP "${nama}" sama dengan pengguna lain, dikosongkan. Isi nomor yang berbeda setelah migrasi.`); return null; } hpDipakai.add(n); return n; };
H('pengguna'); const pemilik = ++nu; uid['Admin'] = uid['Pemilik'] = pemilik;
ins('pengguna', { id: pemilik, nama: 'Pemilik', no_hp: hpUnik(S.admNo, 'Pemilik'), peran: 'pemilik', jabatan: 'Pemilik', pin_hash: null, wajib_atur_pin: 1, aktif: 1 });
(S.kar || []).forEach(k => { const id = ++nu; uid[k.n] = id; ins('pengguna', { id, nama: k.n, no_hp: hpUnik(k.hp, k.n), peran: 'karyawan', jabatan: k.jab || null, pin_hash: null, wajib_atur_pin: 1, aktif: k.on === 0 ? 0 : 1 }); });
const oleh = n => (n && uid[n]) || null;

// ---- layanan ----
H('layanan'); const lid = {}; let nl = 0;
(S.svc || []).forEach((s, i) => { const id = ++nl; lid[s.k] = id; ins('layanan', { id, kode: s.k, nama: s.n, harga: s.h || 0, satuan: s.u || 'kg', durasi_jam: s.j || 24, aktif: s.on ? 1 : 0, urutan: i, produk: 0, stok: null }); });
(S.prd || []).forEach((s, i) => { const id = ++nl; lid[s.k] = id; ins('layanan', { id, kode: s.k, nama: s.n, harga: s.h || 0, satuan: s.u || 'pcs', durasi_jam: 0, aktif: s.on === 0 ? 0 : 1, urutan: 200 + i, produk: 1, stok: s.st == null ? null : s.st }); });
ordersAsli.forEach(o => items(o).forEach(x => { if (!lid[x.sv]) { const id = ++nl; lid[x.sv] = id; ins('layanan', { id, kode: String(x.sv), nama: String(x.sv), harga: 0, satuan: 'pcs', durasi_jam: 24, aktif: 0, urutan: 99 }); } }));
const svInfo = k => (S.svc || []).find(s => s.k === k) || (S.prd || []).find(s => s.k === k) || { n: String(k), u: 'pcs' };

// ---- pelanggan ----
const pel = {}; let np = 0; const pelOrder = [];
const ada = (wa, nama, ms) => { const k = NW(wa); if (!k) return null; if (!pel[k]) { pel[k] = { id: ++np, nama: nama || k, no_wa: k, dibuat: ms || Date.now() }; pelOrder.push(k); } else { if (nama && ms >= (pel[k].terakhir || 0)) { pel[k].nama = nama; pel[k].terakhir = ms; } if (ms && ms < pel[k].dibuat) pel[k].dibuat = ms; } return pel[k]; };
ordersAsli.forEach(o => { const p = ada(o.wa, o.nama, o.masuk); if (p) p.terakhir = Math.max(p.terakhir || 0, o.masuk); });
(S.acc || []).forEach(a => ada(a.w, a.n, a.t));
Object.keys(S.sal || {}).forEach(k => ada(k, null, null));
Object.keys(S.vc || {}).forEach(k => ada(k, null, null));
Object.keys(S.tebus || {}).forEach(k => ada(k, null, null));
(S.tu || []).forEach(x => ada(x.k, null, null));
(S.cu || []).forEach(c => ada(c.wa, c.nama, c.t || null));
const cuMap = {}; (S.cu || []).forEach(c => { cuMap[NW(c.wa)] = c; });
const kdPakai = new Set((S.cu || []).map(c => c.kd).filter(Boolean)); let kdN = 0;
const kdBaru = () => { let k; do { k = 'CUST' + String(++kdN).padStart(4, '0'); } while (kdPakai.has(k)); kdPakai.add(k); return k; };
H('pelanggan', pelOrder.length); pelOrder.forEach(k => { const p = pel[k], c = cuMap[k] || {}, tw = /^620000\d{6}$/.test(k); ins('pelanggan', { id: p.id, kode: c.kd || kdBaru(), nama: p.nama, no_wa: tw ? null : p.no_wa, tanpa_wa: tw ? 1 : 0, alamat: c.alamat || null, catatan_internal: c.cat || null, bermasalah: c.blok ? 1 : 0, dibuat_pada: waktu(p.dibuat) }); });
H('diskon', (S.dsk || []).length); (S.dsk || []).forEach((d, i) => ins('diskon', { id: i + 1, nama: d.n, jenis: d.t === 'p' ? 'persen' : 'rupiah', nilai: d.v || 0, aktif: d.on === 0 ? 0 : 1 }));
H('akun_pelanggan'); (S.acc || []).forEach(a => { const p = pel[NW(a.w)]; if (p) ins('akun_pelanggan', { pelanggan_id: p.id, kata_sandi_hash: null, legacy_salt: a.s, legacy_hash: a.h, disetujui_oleh: pemilik, dibuat_pada: waktu(a.t) }); });

// ---- pesanan, item, pembayaran, log ----
const KODE = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ', dipakai = new Set();
const kodeAcak = () => { let k; do { const b = crypto.randomBytes(10); k = [...b].map(x => KODE[x % 32]).join(''); } while (dipakai.has(k)); dipakai.add(k); return k; };
const nota = {}; const harian = {};
ordersAsli.forEach(o => { const m = String(o.no || '').match(/^ORD-(\d{8})-(\d+)$/); let no = o.no; if (!m) { const d = new Date(o.masuk), y = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0'); harian[y] = (harian[y] || 0) + 1; no = 'ORD-' + y + '-' + String(harian[y]).padStart(4, '0'); } nota[o.id] = no; });
H('pesanan', ordersAsli.length); const lacak = {};
let ni = 0, nb = 0, ns = 0, nlg = 0;
const itemRows = [], bayarRows = [], logRows = [], saldoRows = [], poinRows = [], vcRows = [];
ordersAsli.forEach(o => {
  const p = pel[NW(o.wa)], st = STATUS[o.st] || 'diterima', log = (o.log && o.log.length) ? o.log : [{ t: o.masuk, s: 0 }].concat(o.sel ? [{ t: o.sel, s: 2 }] : []);
  const diambil = (log.find(x => x.s === 3) || {}).t || (o.st === 3 ? o.sel : null);
  lacak[o.id] = kodeAcak();
  ins('pesanan', { id: o.id, no_nota: nota[o.id], kode_lacak: lacak[o.id], pelanggan_id: p.id, status: st, diskon: o.disk || 0, diskon_keterangan: o.dn || null, penjualan: o.jual ? 1 : 0, voucher_nilai: o.vc || 0, total: o.total, estimasi_selesai: waktu(o.est), selesai_pada: waktu(o.sel || null), diambil_pada: waktu(diambil || null), catatan: o.cat || null, jumlah_baju: o.jb || null, jemput: o.jem ? 1 : 0, antar: o.ant ? 1 : 0, alamat: o.alm || null, jadwal_jemput: waktu(o.jj || null), jadwal_antar: waktu(o.ja || null), penanggung_jawab_id: oleh(o.pj), dibuat_oleh: oleh(o.pj), dibuat_pada: waktu(o.masuk), dibatalkan_pada: o.batal ? waktu(o.batal.t) : null, dibatalkan_oleh: o.batal ? oleh(o.batal.by) : null, alasan_batal: o.batal ? o.batal.alasan : null });
  items(o).forEach(x => { const sv = svInfo(x.sv); itemRows.push({ id: ++ni, pesanan_id: o.id, layanan_id: lid[x.sv], nama_layanan: sv.n, satuan: sv.u, jumlah: x.qty, harga_satuan: x.hs, subtotal: Math.round(x.qty * x.hs), catatan: x.c || null, jumlah_pakaian: x.jp || null, siap_pada: x.s ? waktu(o.sel || o.masuk) : null }); });
  (o.pay || legacyPay(o)).forEach(y => { bayarRows.push({ id: ++nb, pesanan_id: o.id, metode: METODE[y.m] || 'tunai', jumlah: y.a, referensi: y.ref || null, catatan: y.n || null, dibayar_pada: waktu(y.t), dicatat_oleh: oleh(y.by) }); });
  log.forEach(x => logRows.push({ id: ++nlg, pesanan_id: o.id, status: STATUS[x.s] || 'diterima', waktu: waktu(x.t), oleh: oleh(x.by) }));
  if (o.st === 3 && !o.jual) poinRows.push({ pelanggan_id: p.id, jenis: 'dapat', poin: Math.floor(o.total / 10000), pesanan_id: o.id, dibuat_pada: waktu(diambil || o.masuk) });
  if (o.vc > 0) vcRows.push({ pelanggan_id: p.id, nilai: o.vc, sumber: 'tebus_poin', dibuat_pada: waktu(o.masuk), dipakai_pada: waktu(o.masuk), pesanan_id: o.id });
});
H('pesanan_item', itemRows.length); itemRows.forEach(r => ins('pesanan_item', r));
H('pembayaran', bayarRows.length); bayarRows.forEach(r => ins('pembayaran', r));
H('status_pesanan_log', logRows.length); logRows.forEach(r => ins('status_pesanan_log', r));

// ---- saldo (buku besar) : isi dari S.tu, pakai dari pembayaran 'saldo', lalu penyesuaian agar sama dengan saldo aplikasi ----
const hitung = {};
(S.tu || []).forEach(x => { const p = pel[NW(x.k)]; if (!p) return; saldoRows.push({ pelanggan_id: p.id, jenis: 'isi', jumlah: x.a, metode: METODE[x.m] && x.m !== 'Saldo' ? METODE[x.m] : 'tunai', referensi: x.ref || null, pesanan_id: null, dibuat_pada: waktu(x.t), dibuat_oleh: oleh(x.by) }); hitung[p.id] = (hitung[p.id] || 0) + x.a; });
ordersAsli.forEach(o => (o.pay || legacyPay(o)).filter(y => y.m === 'Saldo').forEach(y => { const p = pel[NW(o.wa)]; saldoRows.push({ pelanggan_id: p.id, jenis: y.a >= 0 ? 'pakai' : 'kembali', jumlah: -y.a, metode: null, referensi: null, pesanan_id: o.id, dibuat_pada: waktu(y.t), dibuat_oleh: oleh(y.by) }); hitung[p.id] = (hitung[p.id] || 0) - y.a; }));
Object.keys(S.sal || {}).forEach(k => { const p = pel[NW(k)]; const sel = (S.sal[k] || 0) - (hitung[p.id] || 0); if (sel !== 0) saldoRows.push({ pelanggan_id: p.id, jenis: 'penyesuaian', jumlah: sel, metode: null, referensi: null, pesanan_id: null, dibuat_pada: waktu(Date.now()), dibuat_oleh: pemilik }); });
H('saldo_mutasi', saldoRows.length); saldoRows.forEach((r, i) => ins('saldo_mutasi', Object.assign({ id: i + 1 }, r)));

// ---- poin & voucher ----
Object.keys(S.tebus || {}).forEach(k => { const p = pel[NW(k)]; if (p && S.tebus[k] > 0) poinRows.push({ pelanggan_id: p.id, jenis: 'tebus', poin: S.tebus[k], pesanan_id: null, dibuat_pada: waktu(Date.now()) }); });
H('poin_mutasi', poinRows.length); poinRows.forEach((r, i) => ins('poin_mutasi', Object.assign({ id: i + 1 }, r)));
Object.keys(S.vc || {}).forEach(k => { const p = pel[NW(k)]; let sisa = S.vc[k] || 0; while (sisa > 0) { const n = Math.min(25000, sisa); vcRows.push({ pelanggan_id: p.id, nilai: n, sumber: 'tebus_poin', dibuat_pada: waktu(Date.now()), dipakai_pada: null, pesanan_id: null }); sisa -= n; } });
H('voucher', vcRows.length); vcRows.forEach((r, i) => ins('voucher', Object.assign({ id: i + 1 }, r)));

// ---- testimoni, tutup kas, jejak aktivitas, nomor nota harian ----
H('testimoni'); (S.tes || []).forEach((x, i) => ins('testimoni', { id: i + 1, nama: x.n, bintang: x.b, isi: x.t, tampil: x.on === 0 ? 0 : 1, dibuat_pada: waktu(x.d) }));
H('tutup_kas'); (S.kas || []).forEach((x, i) => ins('tutup_kas', { id: i + 1, tanggal: waktu(x.t).slice(0, 10), modal_awal: x.modal || 0, menurut_sistem: x.exp, uang_laci: x.act, selisih: x.diff, dibuat_oleh: oleh(x.by), dibuat_pada: waktu(x.t) }));
H('jejak_aktivitas'); (S.al || []).forEach((x, i) => ins('jejak_aktivitas', { id: i + 1, waktu: waktu(x.t), pengguna_id: oleh(x.by), aksi: x.a, nota: x.n || null, keterangan: x.x || null }));
H('nomor_nota_urut'); const urut = {};
ordersAsli.forEach(o => { const m = nota[o.id].match(/^ORD-(\d{4})(\d{2})(\d{2})-(\d+)$/); if (m) { const d = `${m[1]}-${m[2]}-${m[3]}`; urut[d] = Math.max(urut[d] || 0, +m[4]); } });
Object.entries(S.nc || {}).forEach(([y, n]) => { const d = `${y.slice(0, 4)}-${y.slice(4, 6)}-${y.slice(6, 8)}`; urut[d] = Math.max(urut[d] || 0, n); });
Object.entries(urut).forEach(([d, n]) => ins('nomor_nota_urut', { tanggal: d, terakhir: n }));

// ---- gambar -> berkas ----
fs.mkdirSync(path.join(outDir, 'uploads'), { recursive: true });
const simpanGambar = (url, nama) => { const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(url || ''); if (!m) return null; const ext = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/svg+xml': 'svg' }[m[1].toLowerCase()] || 'bin'; const f = nama + '.' + ext; fs.writeFileSync(path.join(outDir, 'uploads', f), Buffer.from(m[2], 'base64')); return 'uploads/' + f; };
const logoPath = simpanGambar(S.logo, 'logo'), popPath = simpanGambar((S.pop || {}).img, 'popup');
H('banner_promo'); (S.promo || []).forEach((u, i) => { const f = simpanGambar(u, 'banner-' + (i + 1)); if (f) ins('banner_promo', { id: i + 1, path_gambar: f, judul: (S.pj || [])[i] || null, urutan: i, aktif: 1 }); });

// ---- pengaturan (kunci rahasia tidak dikirim ke halaman publik) ----
const pg = (k, v, r) => { if (v === undefined || v === null || v === '') return; ins('pengaturan', { kunci: k, nilai: typeof v === 'string' ? v : JSON.stringify(v), rahasia: r ? 1 : 0 }); };
H('pengaturan');
pg('nama_laundry', S.nama); pg('tautan_halaman', S.base); pg('warna_tema', S.warna); pg('pengumuman', S.info); pg('tautan_ulasan', S.rev);
pg('profil', S.pm); pg('jam_operasional', S.ops); pg('faq', S.faq); pg('template_wa', S.tpl); pg('pesan_status', S.pst); pg('batas_hari_belum_diambil', S.nHari);
pg('popup_promo', Object.assign({}, S.pop, { img: undefined, path: popPath })); pg('logo_path', logoPath);
pg('teks_qris', S.qris, true);

const head = ['-- Dibuat oleh migrasi.js. Impor SETELAH schema.sql. Waktu dalam UTC.', 'SET NAMES utf8mb4;', 'SET FOREIGN_KEY_CHECKS=0;', 'START TRANSACTION;'];
fs.writeFileSync(path.join(outDir, 'data.sql'), head.concat(sql, ['COMMIT;', 'SET FOREIGN_KEY_CHECKS=1;']).join('\n') + '\n');
const r = [`Pengguna: ${nu} (PIN TIDAK dipindahkan; pemilik dan karyawan mengatur PIN baru saat login pertama)`, `Layanan: ${nl}`, `Pelanggan: ${np} (kode CUST dibuat otomatis bila belum ada)`, `Diskon tersimpan: ${(S.dsk || []).length}`, `Produk dijual: ${(S.prd || []).length}`, `Akun pelanggan: ${(S.acc || []).length}`, `Pesanan: ${ordersAsli.length} (dibatalkan: ${ordersAsli.filter(o => o.st === 4).length})`, `Item: ${itemRows.length}`, `Pembayaran: ${bayarRows.length}`, `Saldo mutasi: ${saldoRows.length}`, `Voucher: ${vcRows.length}`, `Testimoni: ${(S.tes || []).length}`, `Tutup kas: ${(S.kas || []).length}`, `Jejak aktivitas: ${(S.al || []).length}`, `Gambar: ${fs.readdirSync(path.join(outDir, 'uploads')).length} berkas`, '', 'Kode lacak lama TIDAK dipakai; setiap pesanan mendapat kode acak baru 10 karakter.'].concat(peringatan.length ? ['', 'PERINGATAN:'].concat(peringatan) : []);
fs.writeFileSync(path.join(outDir, 'ringkasan.txt'), r.join('\n') + '\n');
fs.writeFileSync(path.join(outDir, 'kode-lacak.json'), JSON.stringify(Object.fromEntries(ordersAsli.map(o => [nota[o.id], lacak[o.id]])), null, 1));
console.log(r.join('\n'));
