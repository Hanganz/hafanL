# Notifikasi aplikasi - Hafan Laundry v1.3.16

## Yang sudah ada
- **Pusat notifikasi** (lonceng di header staf, dan menu Profil > Notifikasi > Pusat notifikasi untuk staf dan pelanggan): daftar, belum dibaca, tandai dibaca, muat lebih banyak.
- **Kirim pengumuman** (khusus owner): judul, isi, jenis, penerima (semua, staf, owner, kasir, pelanggan), layar tinjau sebelum kirim, riwayat (berapa staf sudah membaca), dan Tarik notifikasi bila salah kirim.
- **Real-time untuk staf** lewat Realtime Supabase. Bila gagal tersambung, aplikasi memeriksa tiap 30 detik. **Pelanggan** memeriksa tiap 60 detik (tidak memakai koneksi Realtime agar tidak melewati batas paket gratis).
- **Anti kirim ganda:** setiap kiriman membawa kunci unik. Tombol ditekan dua kali atau koneksi putus lalu mengirim ulang tidak membuat notifikasi dobel. Batas 10 kiriman per menit.
- Notifikasi baru memunculkan toast, getar (bila diaktifkan di Pengaturan notifikasi), dan notifikasi peramban bila tab sedang tidak aktif dan izin sudah diberikan.

## Pemasangan
1. Jalankan `sql/20_notifikasi.sql` (atau `00_PASANG_SEMUA.sql`) di Supabase SQL Editor. Ini membuat tabel `kl_notif`, `kl_notif_baca`, `kl_notif_kunci`, kebijakan RLS, fungsi RPC, dan menambahkan `kl_notif` ke publikasi `supabase_realtime`.
2. Pastikan Realtime aktif: Supabase > Database > Publications > `supabase_realtime` harus memuat `kl_notif`.
3. Deploy aplikasi versi 1.3.16. CSP sudah mengizinkan `wss://*.supabase.co`.
4. Uji: masuk sebagai owner > lonceng > Kirim pengumuman ke "Semua staf". Di perangkat staf lain, notifikasi muncul dalam hitungan detik.

## Keamanan
- Tabel notifikasi hanya bisa dibaca (SELECT) lewat kebijakan RLS: pelanggan dan staf hanya melihat pengumuman yang menjadi hak mereka. Tidak ada INSERT, UPDATE, DELETE langsung dari klien.
- Mengirim, menarik, dan melihat riwayat hanya untuk peran `owner` (diperiksa di database, bukan hanya di tampilan).
- Isi notifikasi ditampilkan dengan escape HTML (tidak bisa menyisipkan skrip).
- Pengumuman untuk pelanggan bersifat publik: jangan menulis data pribadi atau rahasia.

## Belum ada
- **Notifikasi saat aplikasi tertutup (Web Push) belum aktif.** `sw.js` sudah punya handler `push` dan `notificationclick`, tetapi belum ada langganan push, tabel penyimpan langganan, dan pengirim di server. Kebutuhannya: (1) pasangan kunci VAPID (simpan kunci privat sebagai secret), (2) tabel + RPC untuk menyimpan langganan per perangkat dengan persetujuan pengguna, (3) Edge Function pengirim memakai pustaka web-push, dipanggil saat `kl_notif_kirim`, (4) di iPhone, aplikasi harus dipasang ke Layar Utama (iOS 16.4 ke atas). Kabari bila ingin dilanjutkan.
- Notifikasi otomatis dari sistem (order selesai, pembayaran masuk) belum dibuat. Pelunasan tetap lewat alur pembayaran yang sudah ada; jangan mengirim konfirmasi pembayaran lewat pengumuman.

## Mundur (rollback)
`alter publication supabase_realtime drop table public.kl_notif;` lalu aplikasi tetap memakai polling. Fitur dapat dimatikan penuh dengan tidak memasang SQL 20: aplikasi mendeteksi fungsi tidak ada dan menampilkan "belum aktif".

## Pemecahan masalah
- Pusat notifikasi menulis "belum aktif": SQL 20 belum dijalankan.
- Tidak real-time tapi daftar tetap berubah tiap 30 detik: Realtime belum aktif atau `kl_notif` belum ada di publikasi. Aplikasi mencoba lagi tiap 10 menit.
- Bagian Real-time belum diuji pada server Supabase asli (protokol diuji dengan server tiruan). Uji pertama menentukan.
