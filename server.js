// Server API siap pakai saat hosting + domain sudah ada.  Jalankan: node server.js   (butuh: npm i mysql2)
// Rute publik : GET /api/lacak/:kode   GET /api/lacak-nota?nota=..&wa4=....   GET /api/testimoni   POST /api/testimoni
// Rute webhook: POST /webhook/mutasi   (ditandatangani penyedia mutasi)
// BELUM ADA (tahap berikutnya, dibangun bersama): login admin/karyawan, order, pembayaran, pelanggan, laporan.
// Variabel lingkungan (JANGAN ditaruh di kode atau di halaman aplikasi):
//   DB_HOST DB_USER DB_PASS DB_NAME    koneksi MySQL                      PORT (bawaan 3000)
//   MUTASI_SECRET  MUTASI_MODE (hmac|token)  MUTASI_HEADER  MUTASI_SUMBER   untuk webhook mutasi (kosong = rute mati)
//   GARAM_IP       teks acak panjang untuk men-hash IP pengulas
//   ALLOW_ORIGIN   alamat web aplikasi, mis. https://app.domainmu.com (kosong = hanya satu domain)
//   TRUST_PROXY=1  isi bila server di belakang proxy/hosting yang meneruskan IP lewat x-forwarded-for
const http = require('http'), mysql = require('mysql2/promise');
const { cekTandaTangan, petakan, terima } = require('./mutasi-core'), { kirim, daftarTampil } = require('./testimoni-core'), { lacakKode, lacakNota } = require('./lacak-core'), adapter = require('./adapter-mysql');
const E = process.env;
if (!E.GARAM_IP || E.GARAM_IP.length < 16) { console.error('GARAM_IP wajib diisi (minimal 16 karakter acak)'); process.exit(1); }
const db = adapter(mysql.createPool({ host: E.DB_HOST || 'localhost', user: E.DB_USER, password: E.DB_PASS, database: E.DB_NAME, connectionLimit: 8 }));

// pembatas laju sederhana di memori: cegah tebak-tebakan kode dan banjir kiriman
const jejak = new Map();
const boleh = (kunci, maks, ms) => { const n = Date.now(), a = (jejak.get(kunci) || []).filter(t => n - t < ms); if (a.length >= maks) { jejak.set(kunci, a); return false; } a.push(n); jejak.set(kunci, a); return true; };
setInterval(() => { const n = Date.now(); for (const [k, a] of jejak) if (!a.length || n - a[a.length - 1] > 36e5) jejak.delete(k); }, 6e5).unref();
const ipDari = r => (E.TRUST_PROXY === '1' && String(r.headers['x-forwarded-for'] || '').split(',')[0].trim()) || r.socket.remoteAddress || '';

const baca = (req, maks = 2e5) => new Promise((ok, gagal) => { const b = []; let n = 0; req.on('data', c => { n += c.length; if (n > maks) { gagal(new Error('terlalu besar')); req.destroy(); } else b.push(c); }); req.on('end', () => ok(Buffer.concat(b).toString('utf8'))); req.on('error', gagal); });

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'), ip = ipDari(req);
  const kirimJson = (k, o) => { res.writeHead(k, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...(E.ALLOW_ORIGIN ? { 'Access-Control-Allow-Origin': E.ALLOW_ORIGIN, 'Vary': 'Origin' } : {}) }); res.end(JSON.stringify(o)); };
  try {
    if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': E.ALLOW_ORIGIN || '', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' }); return res.end(); }
    if (req.method === 'GET' && u.pathname === '/api/sehat') return kirimJson(200, { ok: true });
    let m;
    if (req.method === 'GET' && (m = u.pathname.match(/^\/api\/lacak\/([A-Za-z0-9-]{4,16})$/))) {
      if (!boleh('lc:' + ip, 30, 6e4)) return kirimJson(429, { ok: false, pesan: 'Terlalu sering, coba sebentar lagi' });
      const r = await lacakKode(db, m[1]); return r ? kirimJson(200, { ok: true, data: r }) : kirimJson(404, { ok: false, pesan: 'Tidak ditemukan' });
    }
    if (req.method === 'GET' && u.pathname === '/api/lacak-nota') {
      if (!boleh('ln:' + ip, 15, 6e4)) return kirimJson(429, { ok: false, pesan: 'Terlalu sering, coba sebentar lagi' });
      const r = await lacakNota(db, u.searchParams.get('nota'), u.searchParams.get('wa4')); return r ? kirimJson(200, { ok: true, data: r }) : kirimJson(404, { ok: false, pesan: 'Tidak ditemukan' });
    }
    if (req.method === 'GET' && u.pathname === '/api/testimoni') return kirimJson(200, { ok: true, data: await daftarTampil(db) });
    if (req.method === 'POST' && u.pathname === '/api/testimoni') {
      if (!boleh('ts:' + ip, 10, 36e5)) return kirimJson(429, { ok: false, pesan: 'Terlalu sering, coba lagi nanti' });
      let b; try { b = JSON.parse(await baca(req, 5e3)); } catch (e) { return kirimJson(400, { ok: false, pesan: 'Data tidak valid' }); }
      const r = await kirim(db, { kode: b.kode, nama: b.nama, bintang: b.bintang, isi: b.isi, ip }, { garam: E.GARAM_IP }); return kirimJson(r.ok ? 201 : 422, r.ok ? { ok: true } : { ok: false, pesan: r.alasan });
    }
    if (req.method === 'POST' && u.pathname === '/webhook/mutasi') {
      if (!E.MUTASI_SECRET) return kirimJson(404, { ok: false });
      const mentah = await baca(req, 1e6), HEADER = (E.MUTASI_HEADER || 'x-signature').toLowerCase();
      if (!cekTandaTangan(mentah, E.MUTASI_SECRET, req.headers[HEADER], E.MUTASI_MODE || 'hmac')) return kirimJson(401, { ok: false, pesan: 'tanda tangan salah' });
      const hasil = []; for (const x of petakan(JSON.parse(mentah))) hasil.push(await terima(db, E.MUTASI_SUMBER || 'mutasiku', x));
      console.log(new Date().toISOString(), 'mutasi', JSON.stringify(hasil.map(h => h.status))); return kirimJson(200, { ok: true, hasil });
    }
    kirimJson(404, { ok: false });
  } catch (e) { console.error(e); kirimJson(500, { ok: false, pesan: 'Kesalahan server' }); }
}).listen(E.PORT || 3000, () => console.log('API aktif di port ' + (E.PORT || 3000)));
