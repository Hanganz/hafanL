# Panduan Pembayaran QRIS lewat QiosPay (qiospay.com) - Hafan Laundry v1.3.11

QiosPay adalah **payment gateway QRIS**: tiap pembayaran dibuat sebagai **tagihan** lewat API, QR-nya dari QiosPay, dan status lunas dikirim lewat **webhook bertanda tangan**. Tidak perlu Mutasiku, tidak perlu QRIS statis, tidak perlu HP khusus.

Dokumentasi resmi: https://my.qiospay.com/dokumentasi dan https://qiospay.com/developer

## Yang memakai QiosPay
1. **Pesanan online (menu Toko, sisi pelanggan).** Tombol *Bayar sekarang* membuat tagihan lewat fungsi `qiospay-invoice` (nominal diambil dari database). Webhook menandai pesanan lunas berdasarkan **kode pesanan**.
2. **Pembayaran di kasir** (Bayar, pilih QRIS, baik dari popup bayar maupun tombol *Tampilkan QR* di detail order). Fungsi `qiospay-kasir` (khusus staf yang login) membuat tagihan dengan referensi `N-<id order>-<kode>`. Saat webhook masuk, aplikasi mencocokkan ke order **lewat referensi itu**, bukan menebak nominal, sehingga dua order dengan nominal sama tidak tertukar.

3. **Pelanggan bayar nota laundry di halaman Lacak.** Kartu *Bayar via QRIS* membuat tagihan lewat fungsi `qiospay-lacak` untuk **sisa bayar** nota (nominal dari database, referensi `L-<kode tracking>-R<n>`). Begitu webhook masuk, halaman Lacak berubah jadi centang *Pembayaran diterima* tanpa kasir perlu terbuka. Uang masuknya lalu dicatat ke nota oleh aplikasi kasir (otomatis saat terbuka, dicocokkan lewat kode tracking).

## Yang tidak memakai QiosPay
- **QR di struk**: tidak dicetak lagi (QR QiosPay bersifat sementara). Pelanggan membayar lewat link Lacak atau QR dari kasir.
- **Isi saldo lewat QRIS**: tombol QRIS disembunyikan saat mode QiosPay aktif. Gunakan Tunai atau Transfer.
- **Pembayaran di bawah Rp1.000** tidak bisa lewat QRIS QiosPay.

## Syarat dan batas dari QiosPay (menurut situs mereka)
- Nominal tagihan **Rp1.000 sampai Rp10.000.000**.
- Paket gratis: **100 transaksi per hari**, 120 permintaan per menit.
- MDR 0% sampai Rp200.000, 0,5% di atasnya. Pencairan Rp2.500 per kali, minimal Rp10.000, siap cair sekitar 3 jam setelah lunas. Cek angka terbaru di dashboard.
- Pembeli membayar **nominal plus kode unik** (mis. Rp35.057 untuk tagihan Rp35.000), seperti yang tampil di layar bayar.
- Masa berlaku tagihan diatur di dashboard QiosPay (5 sampai 120 menit). Jika habis, tombol *Buat QR baru* membuat tagihan baru.
- Dana masuk ke **saldo QiosPay**, lalu dicairkan ke rekening. Cairkan berkala.

## Pemasangan
1. **Daftar** di https://my.qiospay.com/daftar. Salin **API Key** (`qp_live_...`) dan cari **Webhook Secret** di dashboard.
2. **SQL:** pasang lewat `00_PASANG_SEMUA.sql` (lihat PANDUAN-PASANG-ULANG.md). Jika memakai file terpisah, `12_migrasi_qiospay.sql` lalu `14_migrasi_lacak_qiospay.sql` setelah 01 sampai 10.
3. **Empat fungsi** (Edge Functions, nama persis, tempel `index.ts` masing-masing):
   - `qiospay-invoice`: **nonaktifkan Verify JWT**
   - `qiospay-lacak`: **nonaktifkan Verify JWT** (dipanggil pelanggan di halaman Lacak)
   - `qiospay-hook`: **nonaktifkan Verify JWT**
   - `qiospay-kasir`: Verify JWT boleh dibiarkan (fungsi memeriksa sendiri token staf)
4. **Secrets:** `QIOSPAY_API_KEY` dan `QIOSPAY_WEBHOOK_SECRET` (minimal 16 karakter).
5. **Aktifkan:** Pengaturan, Pembayaran & QRIS, pilih **QiosPay (qiospay.com)**, Simpan Semua Perubahan.
6. Jika QiosPay meminta alamat webhook di dashboard: `https://<proyek>.supabase.co/functions/v1/qiospay-hook` (alamat ini juga dikirim otomatis di setiap tagihan).

## Uji (urut)
1. **Toko:** pesanan minimal Rp1.000, *Bayar sekarang*, QR dan nominal dengan kode unik muncul. Bayar tepat nominalnya, layar jadi centang.
2. **Kasir:** buka order, Bayar, QRIS. QR muncul dengan nominal plus kode unik. Setelah dibayar, order tercatat lunas otomatis dan popup menampilkan *Pembayaran diterima*.
3. **Lacak (pelanggan):** buat order bernominal minimal Rp1.000, belum lunas. Buka Lacak dengan kode tracking di HP lain, tekan *Tampilkan QR*, bayar tepat nominalnya. Kartu berubah jadi centang dalam sekitar 5 detik tanpa muat ulang. Buka aplikasi kasir: order tercatat lunas otomatis.
4. **Kasir dua order kembar:** buat dua order bernominal sama, bayar salah satunya. Hanya order yang QR-nya dibayar yang lunas.
5. **Log** bila gagal: Supabase, Edge Functions, pilih fungsi, **Logs**.
   - `qiospay-hook` `401 Tanda tangan tidak valid`: `QIOSPAY_WEBHOOK_SECRET` salah atau format tanda tangan QiosPay berbeda dari dokumentasinya.
   - `qiospay-kasir` atau `qiospay-lacak` `API Key QiosPay salah`: periksa `QIOSPAY_API_KEY`.
   - Kartu Lacak menulis *Fungsi qiospay-lacak belum dipasang*: buat fungsi itu di Supabase (Verify JWT dimatikan).
6. **Cairkan** nominal kecil ke rekening.

## Notifikasi WhatsApp ke pembeli (v1.3.11)
- Tagihan kini dikirim ke QiosPay beserta `whatsapp_buyer` (nomor pelanggan format 62...). Tanpa nomor itu timeline QiosPay menulis *Tidak dikirim (nomor WA pembeli kosong)*. Nomor pengganti tamu (`620000xxxxxx`) tidak dikirim.
- Di QiosPay, Notifikasi, Pengaturan: aktifkan *Notifikasi ke pembeli*. Di tab *Template pesan* tempel teks berikut (tab Pesan lunas), lalu Simpan template:
```
✅ *PEMBAYARAN BERHASIL*
_______________________

Terima kasih, Kak! Pembayaran laundry Anda sudah kami terima. 🧺✨

🧾 *Nota:* {keterangan}
💰 *Total Dibayar:* Rp {total} (termasuk kode unik)
📅 *Waktu:* {waktu} WIB

Cucian Anda segera kami proses dengan bersih dan wangi. Kami akan mengabari kembali jika sudah selesai ya, Kak! 🙏

Salam hangat,
*{nama_toko}*
```
- `{keterangan}` berisi nomor nota asli dan nama pelanggan (mis. `Nota ORD-20261108-0009 a.n. Fanny`). Jangan pakai `{order_id}` karena itu kode referensi internal (`L-KODE-R1`).
- Halaman Lacak membutuhkan nomor lengkap di database: jalankan `16_wa_lacak.sql`, lalu buka aplikasi kasir dan simpan sekali agar data tersinkron.
- Tagihan Lacak yang masih berlaku dipakai ulang, jadi uji dengan nota baru atau tunggu tagihan lama kedaluwarsa.

## Keamanan
- API Key hanya di Supabase Secrets. Tidak pernah masuk ke kode web atau halaman Pengaturan.
- Webhook diverifikasi HMAC-SHA256 (`t + "." + isi`), dibandingkan konstan. Webhook yang sama dikirim ulang diabaikan (ID unik di database).
- Nominal pesanan Toko dan tagihan Lacak selalu dari database. `qiospay-kasir` hanya menerima staf yang login dan terdaftar di `kl_staf`.
- Jika API Key bocor: rotasi di dashboard QiosPay lalu perbarui `QIOSPAY_API_KEY`.

## Catatan
- Ini status dari QiosPay, bukan konfirmasi bank. Jika layanan mereka terganggu, pembayaran tidak terdeteksi otomatis dan kasir tetap bisa mencatat manual.
- Penyedia lain (Mutasiku, HP Tasker) tetap tersedia di Pengaturan. Jangan aktifkan dua penyedia untuk uang yang sama.
