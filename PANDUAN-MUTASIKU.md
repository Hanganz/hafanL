# Panduan Pembayaran Otomatis (Mutasiku) - Hafan Laundry v1.3.0

Uang yang masuk ke akun Mutasiku Anda dicocokkan otomatis ke order yang belum lunas, lalu dicatat sebagai pembayaran.
Dokumentasi resmi Mutasiku: docs.mutasiku.co.id/docs/webhooks

## Cara kerjanya
1. Mutasiku mendeteksi uang masuk (CREDIT) lalu mengirim webhook ke fungsi `mutasi-webhook` di Supabase.
2. Fungsi itu memeriksa tanda tangan (HMAC-SHA256, header `X-Webhook-Signature`) dengan secret Anda, lalu menyimpan ke antrean `kl_mutasi`.
3. Aplikasi kasir (saat dibuka) memeriksa antrean tiap sekitar 45 detik. Jika nominalnya sama persis dengan **tepat satu** order yang belum lunas (dan belum dibatalkan, maksimal 21 hari terakhir), pembayaran dicatat otomatis (metode QRIS, dicatat oleh "Mutasiku") dan tersimpan di log aktivitas.
4. Jika nominal tidak cocok, atau cocok dengan lebih dari satu order, muncul kartu **Pembayaran masuk (perlu dicek)** di Beranda. Anda pilih order yang benar, atau Abaikan.

Penting: pencatatan terjadi saat aplikasi kasir terbuka di salah satu perangkat. Kalau semua perangkat tertutup, uang masuk menunggu di antrean dan dicatat begitu aplikasi dibuka.

## Langkah pemasangan (sekali)
1. **Mutasiku**: di Akun & Saldo, hubungkan rekening bank atau e-wallet yang menerima pembayaran laundry.
2. **Supabase, SQL Editor**: New query kosong, tempel `sql/09_migrasi_v9.sql`, Run.
3. **Supabase, Edge Functions**: buat fungsi bernama persis `mutasi-webhook`, tempel isi `supabase/functions/mutasi-webhook/index.ts` (atau `mutasi-webhook-kode.txt`), lalu **matikan "Verify JWT"** pada fungsi itu (Mutasiku tidak mengirim token Supabase). Deploy.
4. **Mutasiku, Settings, Webhooks, Add Webhook**: isi alamat `https://<proyek-anda>.supabase.co/functions/v1/mutasi-webhook` (juga tampil di Pengaturan, Pembayaran & QRIS, Mutasi bank otomatis, tombol Salin alamat). Pilih event `mutations.created`. Salin **Webhook Secret**.
5. **Supabase, Edge Functions, Secrets**: tambah `MUTASIKU_WEBHOOK_SECRET` berisi secret tadi.
6. **Uji**: buat order Rp1.000 yang belum lunas, bayar Rp1.000, tunggu sekitar 1 menit. Atau pakai tombol Test di dashboard Mutasiku (uji kirim akan masuk ke kartu Pembayaran masuk karena tidak cocok dengan order).

## Tips supaya pencocokan akurat
- Dua order dengan sisa tagihan yang sama pada saat bersamaan tidak dicocokkan otomatis (muncul di kartu untuk dipilih). Untuk volume tinggi, sebaiknya tambahkan kode unik pada nominal (mis. Rp35.012) di tahap berikutnya.
- Uang masuk yang bukan pembayaran laundry (mis. transfer pribadi) akan muncul di kartu. Tekan Abaikan.

## Keamanan
- Secret hanya ada di Supabase Secrets, tidak di kode web.
- Kiriman tanpa tanda tangan valid ditolak (401).
- Antrean `kl_mutasi` terkunci (RLS); hanya fungsi server dan staf yang login yang bisa membaca.
- Antrean otomatis dihapus setelah 90 hari.

## Tambahan v1.3.0: batas waktu, kode unik, centang otomatis
Jalankan juga `sql/10_migrasi_v10.sql` (setelah 09). Fungsi Edge tidak berubah.

**Pesanan dari Toko (pelanggan)**
- Setelah pesanan terkirim, tombol **Bayar sekarang (QRIS)** (juga ada di Pesanan saya) membuka layar bayar: QR dengan nominal **total + kode unik 3 digit** (mis. Rp35.123) dan hitung mundur **60 menit**.
- Layar memeriksa status tiap 5 detik. Begitu uang masuk dan cocok, layar berubah jadi centang **Pembayaran diterima**, tanpa login dan tanpa muat ulang.
- Pencocokan dilakukan di **server** (fungsi webhook), jadi centang muncul walau aplikasi kasir tertutup.
- Setelah lunas, layar bayar selalu menampilkan centang dan QR tidak muncul lagi (status disimpan di server, tidak hilang walau halaman dibuka ulang atau perangkat berganti). Di Pesanan saya tampil label **Dibayar**.
- Jika waktu habis: QR hilang, pelanggan bisa **Buat QR baru** atau bayar di toko. Uang yang masuk dalam 10 menit setelah waktu habis masih dicocokkan.
- Di aplikasi kasir, order online yang sudah dibayar otomatis tercatat lunas (metode QRIS, dicatat "Mutasiku") dalam sekitar 45 detik setelah aplikasi dibuka.

**Layar bayar QRIS di kasir**
- QR memakai nominal + kode unik, berlaku **15 menit**, dengan hitung mundur.
- Aplikasi memeriksa uang masuk tiap 4 detik selama layar ini terbuka. Begitu cocok, muncul centang **Pembayaran diterima** lalu layar menutup sendiri, dan order lunas.
- Setelah order lunas, tombol bayar tidak bisa dipakai lagi untuk order itu (muncul pesan "Order ini sudah lunas").
- Jalur manual (isi 4 digit referensi lalu Sudah Dibayar) tetap ada sebagai cadangan.

Kode unik ditambahkan ke total, jadi selisihnya (maksimal Rp999) tercatat sebagai pendapatan tambahan di order itu.
