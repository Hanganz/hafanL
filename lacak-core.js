// Pelacakan untuk pelanggan (publik). Hanya mengembalikan yang boleh dilihat pelanggan:
// TIDAK ada nomor WA, alamat, catatan internal, ID pelanggan, atau data pembayaran per transaksi.
async function rakit(db, p) {
  const [items, tagih, log] = await Promise.all([
    db.all('SELECT nama_layanan, satuan, jumlah, harga_satuan, subtotal, catatan, siap_pada FROM pesanan_item WHERE pesanan_id=? ORDER BY id', [p.id]),
    db.all('SELECT sisa FROM v_tagihan WHERE pesanan_id=?', [p.id]),
    db.all('SELECT status, waktu FROM status_pesanan_log WHERE pesanan_id=? ORDER BY waktu, id', [p.id]),
  ]);
  return { no_nota: p.no_nota, nama: p.nama, status: p.status, total: p.total, diskon: p.diskon, sisa_tagihan: tagih.length ? tagih[0].sisa : 0,
    estimasi_selesai: p.estimasi_selesai, selesai_pada: p.selesai_pada, diambil_pada: p.diambil_pada, dibuat_pada: p.dibuat_pada, item: items, riwayat: log };
}
const KOLOM = 'p.id, p.no_nota, p.status, p.total, p.diskon, p.estimasi_selesai, p.selesai_pada, p.diambil_pada, p.dibuat_pada, pl.nama';
async function lacakKode(db, kode) {
  kode = String(kode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (kode.length < 4 || kode.length > 16) return null;
  const r = await db.all(`SELECT ${KOLOM} FROM pesanan p JOIN pelanggan pl ON pl.id=p.pelanggan_id WHERE p.kode_lacak=?`, [kode]);
  return r.length ? rakit(db, r[0]) : null;
}
// Nomor nota + 4 digit terakhir WA. Pelanggan tanpa WA tidak bisa memakai cara ini (pakai kode lacak).
async function lacakNota(db, nota, wa4) {
  nota = String(nota || '').toUpperCase().trim(); wa4 = String(wa4 || '').replace(/\D/g, '');
  if (!/^ORD-\d{8}-\d{4,}$/.test(nota) || wa4.length !== 4) return null;
  const r = await db.all(`SELECT ${KOLOM} FROM pesanan p JOIN pelanggan pl ON pl.id=p.pelanggan_id WHERE p.no_nota=? AND pl.no_wa IS NOT NULL AND SUBSTR(pl.no_wa,-4)=?`, [nota, wa4]);
  return r.length ? rakit(db, r[0]) : null;
}
module.exports = { lacakKode, lacakNota };
