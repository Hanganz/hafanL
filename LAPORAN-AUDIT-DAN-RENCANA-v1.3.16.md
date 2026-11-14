# Laporan audit dan rencana - Hafan Laundry v1.3.16

Dibuat dari pemeriksaan kode proyek v1.3.15 (bukan dugaan). Status: **Selesai** = sudah dibuat dan diuji di browser headless dengan Supabase tiruan. **Belum** = belum dikerjakan.
Semua yang menyentuh Supabase asli (SQL 18 sampai 20, Realtime, API Mutasiku) **belum diuji pada server asli**.

## 1. Gambaran proyek
- Aplikasi satu halaman tanpa proses build: `index.html`, `app.js` (sekitar 1.700 baris, 288 KB, 557 fungsi global), `style.css`, `icons.js`, dan modul terpisah `profile.js`, `pembayaran.js`, `notif.js`, `pwa.js`, `sw.js`.
- Backend Supabase: 14+ tabel `kl_*`, puluhan fungsi RPC `security definer`, 9+ Edge Function (QiosPay, Mutasiku, WhatsApp, HP, Moota, dst.), login staf lewat Supabase Auth, login pelanggan lewat akun sendiri.
- Pola keamanan data (baik, dipertahankan): RLS aktif pada tabel, hak akses langsung dicabut, semua akses lewat RPC yang memeriksa peran. Satu-satunya pengecualian yang sengaja dibuat: SELECT pada `kl_notif` lewat kebijakan RLS (Realtime membutuhkannya).
- Hosting Vercel, siap pindah ke Cloudflare (`_headers`, `wrangler` belum dibuat).

## 2. Temuan dan tindakan
| # | Temuan | Dampak | Status |
|---|---|---|---|
| 1 | Navigasi bawah mengambang (pil melayang), menutupi konten, bisa menghilang saat scroll | UX mobile, konten tertutup | **Selesai**: bar menempel di dasar layar, tidak bersembunyi, konten diberi jarak aman; rel samping menempel di desktop (>= 1000 px); bar atas menempel untuk pelanggan di desktop |
| 2 | Splash hanya untuk pelanggan, durasi tetap 800 ms (loading palsu); kegagalan memuat data awal hanya toast lalu menampilkan layar kosong atau data contoh | Membingungkan, berisiko staf bekerja pada data kosong | **Selesai**: intro nyata untuk semua pengguna, hilang saat sesi dan data siap, pesan jelas dan tombol Coba lagi bila gagal, penanda koneksi lambat setelah 8 detik, tanpa jeda buatan |
| 3 | Pembayaran masuk hanya berupa antrean `baru` (maks 50), tanpa riwayat, filter, atau detail. Tagihan QRIS tidak terlihat dari aplikasi | Sulit menelusuri pembayaran | **Selesai**: halaman Pembayaran dengan area QIOS dan Mutasiku terpisah (state, filter, daftar masing-masing), ringkasan, pencarian, periode, status, detail, muat lebih banyak, status kosong, galat, dan pencegahan jawaban basi |
| 4 | Tidak ada pemisahan data per penyedia pada tagihan | Area QIOS dan Mutasiku tidak bisa dipisah | **Selesai**: kolom `qp_p` pada tagihan (diisi fungsi), tagihan lama dianggap QiosPay |
| 5 | Tidak ada sistem notifikasi | Pengumuman harus lewat WhatsApp | **Selesai** (dalam aplikasi): SQL 20, pusat notifikasi, kirim pengumuman owner, real-time staf, polling pelanggan, anti kirim ganda. **Belum**: Web Push saat aplikasi tertutup (lihat `PANDUAN-NOTIFIKASI.md`) |
| 6 | Dua palet gelap berbeda (aplikasi biru-abu, profil ungu), aksen tidak mengikuti merek | Tampilan tidak konsisten | **Selesai**: satu palet gelap navy selaras logo, aksen default mengikuti warna merek |
| 7 | Data pembayaran KELUAR tidak ada di sistem (webhook Mutasiku hanya mengirim uang masuk) | Prompt meminta masuk dan keluar | **Tidak dibuat**: tidak ada sumber data. Menampilkan data karangan akan menyesatkan |
| 8 | `app.js` monolitik dan banyak fungsi global | Risiko regresi tinggi, sulit diuji | **Belum** (disarankan): pecah bertahap. Modul baru sudah terpisah |
| 9 | Penentuan area QIOS atau Mutasiku pada pembayaran diterima memakai teks `kl_mutasi.akun` | Rapuh bila nama sumber berubah | **Belum** (disarankan): tambah kolom penyedia eksplisit pada `kl_mutasi` |
| 10 | Tidak ada pengujian otomatis di repo | Regresi baru ketahuan di produksi | **Belum**: pengujian saya dijalankan di luar repo |
| 11 | Redesign menyeluruh | Permintaan prompt | **Sebagian**: token warna, navigasi, header, ikon, Profil, Pembayaran, Notifikasi, intro. **Belum**: halaman Order, Pelanggan, Laporan, Pengaturan, Stok, Pusat Data, Detail Pesanan |

## 3. Pemetaan ikon (sheet 66 ikon)
Sheet adalah gambar raster, jadi bentuk glyph tidak dijiplak. Ke-66 nama pada sheet **sudah ada** di `icons.js` dan dipakai di seluruh aplikasi; gaya tile (gradien, cahaya, terang dan gelap) diselaraskan lewat CSS. Terverifikasi otomatis: 66 dari 66 ada, tanpa yang hilang. Tiga ikon tambahan dibuat untuk Profil: `kamera`, `kunci`, `mata`.
- Beranda pelanggan: lacak, harga, toko, cs, lokasi, bagikan, ulasan, akun
- Menu kasir dan owner: orderbaru, order, jual, pelanggan, hutang, laporan, stok, lainnya, rekap, data, pengaturan, karyawan, owner, kasir
- Layanan laundry: kiloan, baju, mesin, setrika, sepatu, karpet, selimut, gorden, boneka, kilat, antar
- Pembayaran dan promo: bayar, qris, dompet, koin, bank, diskon, hadiah
- Status order: diterima, diproses, selesai, diambil, batal
- Umum: jam, kalender, bell, wa, robot, printer, cadangan, surel, perisai, ponsel, palet, megafon, bulan, matahari, keluar, cari, hapus, edit, rumah, info, tambah

## 4. Risiko yang perlu diketahui
- SQL 18, 19, 20 ditulis dan diperiksa sintaksnya, tetapi belum dijalankan pada PostgreSQL asli. Jalankan di proyek uji atau di luar jam ramai, dan lihat pesan galat bila ada.
- Protokol Realtime diuji dengan server WebSocket tiruan (join, token, heartbeat, penerimaan perubahan, sambung ulang). Bila Supabase memakai versi protokol berbeda, aplikasi otomatis memakai polling 30 detik.
- Nama field balasan API Mutasiku dibaca dengan beberapa kemungkinan (lihat `PANDUAN-MUTASIKU-QRIS.md`).
- Perlu dideploy ulang di Supabase: `qiospay-invoice`, `qiospay-lacak`, `qiospay-kasir`, `mutasi-webhook` (versi 1.3.16).

## 5. Rencana lanjutan yang disarankan (urut)
1. Jalankan SQL 18, 19, 20; deploy ulang empat fungsi; uji alur pembayaran dan notifikasi di dunia nyata.
2. Redesign halaman Order, Detail Pesanan, Pelanggan, Laporan, Pengaturan dengan komponen yang sama (kartu, chip, sheet, token).
3. Web Push (butuh kunci VAPID, tabel langganan, fungsi pengirim).
4. Kolom penyedia eksplisit pada `kl_mutasi`; pecah `app.js`; tambah pengujian otomatis di repo.
5. Pindah hosting ke Cloudflare bila diinginkan.
