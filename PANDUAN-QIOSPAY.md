# Panduan Pembayaran QRIS lewat QiosPay (qiospay.com) - Hafan Laundry v1.3.8

QiosPay adalah **payment gateway QRIS**: setiap pembayaran dibuat sebagai **tagihan** lewat API, QR-nya berasal dari QiosPay, dan status lunas dikirim ke kita lewat **webhook bertanda tangan**. Tidak perlu Mutasiku dan tidak perlu HP khusus.

Dokumentasi resmi: https://my.qiospay.com/dokumentasi dan https://qiospay.com/developer

## Yang berubah di v1.3.8 (dan yang belum)
**Berubah: pembayaran pesanan online (menu Toko di sisi pelanggan).**
1. Pelanggan kirim pesanan lalu tekan **Bayar sekarang**.
2. Fungsi `qiospay-invoice` membuat tagihan di QiosPay (nominal diambil dari database, bukan dari browser) dan mengembalikan QR dinamis, nominal plus kode unik, dan batas waktu.
3. Pelanggan membayar dari e-wallet atau m-banking apa pun.
4. QiosPay mengirim webhook `invoice.paid`. Fungsi `qiospay-hook` memeriksa tanda tangan HMAC lalu menandai pesanan **lunas berdasarkan kode pesanan** (bukan menebak nominal).
5. Layar pelanggan berubah jadi centang, dan order di aplikasi kasir tercatat lunas otomatis.

**Belum berubah: pembayaran di kasir** (QR di struk, Hutang, Jual, Isi saldo). Bagian itu masih memakai QRIS statis yang diunggah di Pengaturan (misalnya QRIS DANA Bisnis) dan konfirmasi manual. QiosPay tidak menyediakan QRIS statis, jadi semua QR dari QiosPay harus dibuat per tagihan lewat API. Mengubah alur kasir adalah tahap berikutnya, setelah alur online terbukti jalan.

## Syarat dan batas dari QiosPay (menurut situs mereka)
- Nominal tagihan **Rp1.000 sampai Rp10.000.000**. Pesanan online di bawah Rp1.000 tidak bisa dibayar QRIS (aplikasi menampilkan pesan agar bayar di toko).
- Paket gratis: **100 transaksi per hari** dan 120 permintaan per menit.
- Biaya: MDR 0% sampai Rp200.000, 0,5% di atasnya. Pencairan saldo Rp2.500 per pencairan, minimal Rp10.000, siap cair sekitar 3 jam setelah lunas. Cek angka terbaru di dashboard sebelum dipakai.
- Pembeli membayar **nominal dengan kode unik** (mis. Rp35.123 untuk tagihan Rp35.000), seperti yang sudah tampil di layar bayar kita.
- Masa berlaku tagihan diatur di dashboard QiosPay (5 sampai 120 menit). Layar pelanggan menghitung mundur dari batas waktu itu. Jika habis, tombol **Buat QR baru** membuat tagihan baru.
- Dana masuk ke **saldo QiosPay**, lalu dicairkan ke rekening. Cairkan berkala dan jangan menyimpan saldo besar.

## Langkah pemasangan
1. **Daftar** di https://my.qiospay.com/daftar. Salin **API Key** (berawalan `qp_live_`). Cari juga **Webhook Secret** di dashboard (bagian pengaturan webhook atau integrasi).
2. **SQL:** Supabase, SQL Editor, New query kosong, tempel `sql/12_migrasi_qiospay.sql`, Run. SQL 09 dan 10 harus sudah pernah dijalankan.
3. **Dua fungsi:** Edge Functions, buat `qiospay-invoice` dan `qiospay-hook` (nama persis), tempel `index.ts` masing-masing, lalu **nonaktifkan Verify JWT pada keduanya**. Deploy.
4. **Secrets:** Edge Functions, Secrets, tambah:
   - `QIOSPAY_API_KEY` = API Key QiosPay
   - `QIOSPAY_WEBHOOK_SECRET` = Webhook Secret dari dashboard (minimal 16 karakter)
5. **Aktifkan di aplikasi:** Pengaturan, Pembayaran & QRIS, pilih penyedia **QiosPay (qiospay.com)**, lalu **Simpan Semua Perubahan**. Ini menyalakan bendera yang memberi tahu halaman pelanggan agar memakai QiosPay.
6. Jika QiosPay meminta alamat webhook di dashboard, isi dengan `https://<proyek>.supabase.co/functions/v1/qiospay-hook`. Alamat ini juga dikirim otomatis pada setiap tagihan.
7. Jika sebelumnya sempat memasang fungsi `qiospay-webhook` (versi untuk qiospay.id), hapus saja. Tidak dipakai lagi.

## Uji (urut)
1. **Tagihan terbentuk.** Buat satu pesanan Toko (minimal Rp1.000), tekan **Bayar sekarang**. QR dan nominal dengan kode unik harus muncul. Jika muncul "API Key QiosPay salah", periksa secret `QIOSPAY_API_KEY`.
2. **Webhook diterima.** Bayar tepat nominal itu. Dalam beberapa detik layar berubah jadi centang. Jika tidak, buka Supabase, Edge Functions, `qiospay-hook`, **Logs**:
   - `401 Tanda tangan tidak valid` berarti `QIOSPAY_WEBHOOK_SECRET` salah, atau format tanda tangan QiosPay berbeda dari dokumentasinya. Cocokkan dengan halaman Dokumentasi di dashboard.
   - Tidak ada log sama sekali berarti QiosPay belum mengirim. Lihat log webhook di dashboard QiosPay.
3. **Kirim ulang aman.** QiosPay mencoba ulang hingga 6 kali. Kiriman yang sama diabaikan otomatis (ID unik di database).
4. **Cek saldo dan cairkan** nominal kecil ke rekening untuk memastikan biaya dan waktunya.

## Keamanan
- API Key hanya ada di Supabase Secrets. Tidak pernah masuk ke kode web atau halaman Pengaturan.
- Webhook diverifikasi dengan HMAC-SHA256 (`t + "." + isi`), dibandingkan secara konstan. Kiriman tanpa tanda tangan yang benar ditolak.
- Nominal tagihan selalu diambil dari database, bukan dari browser, sehingga pelanggan tidak bisa mengubah harga.
- Fungsi `qiospay-invoice` bisa dipanggil tanpa login (pelanggan umum), tetapi hanya untuk kode pesanan yang ada dan belum dibayar, memakai ulang tagihan yang masih berlaku, dan dibatasi jumlah permintaan per IP.
- Jika API Key bocor, rotasi di dashboard QiosPay lalu perbarui `QIOSPAY_API_KEY`.

## Catatan
- Ini bukan konfirmasi dari bank, melainkan status dari QiosPay. Jika layanan mereka terganggu, pembayaran tidak terdeteksi otomatis dan kasir tetap bisa mencatat manual.
- Fungsi HP/Tasker (`notif-webhook`) dan Mutasiku tetap tersedia sebagai penyedia lain di Pengaturan. Jangan aktifkan dua penyedia untuk uang yang sama.
