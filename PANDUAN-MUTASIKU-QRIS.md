# Panduan QRIS per tagihan lewat Mutasiku (GoPay Merchant) - Hafan Laundry v1.3.15

Alurnya sama seperti QiosPay: aplikasi **membuat QR dulu** (status menunggu), pelanggan membayar, lalu order **lunas otomatis** lewat webhook.
Pilihannya ada di Pengaturan, Pembayaran & QRIS, **Penyedia**. Pindah QiosPay <-> Mutasiku cukup dengan mengganti pilihan itu.

## Syarat
- Akun yang terhubung di Mutasiku harus **GoPay Merchant** atau **DANA Bisnis** (jenis yang mendukung QRIS dinamis).
  DANA pribadi, OVO, dan ShopeePay Merchant tidak mendukung QRIS per tagihan; pakai pilihan **Mutasiku** (QRIS statis + kode unik).
- Nominal tagihan minimal Rp1.000 dan maksimal Rp10.000.000 (sama seperti QiosPay).

## Pemasangan (sekali)
1. **SQL:** jalankan `sql/18_mutasiku_qris.sql` (atau jalankan ulang `00_PASANG_SEMUA.sql`). SQL 09, 10, 12 dan 14 harus sudah ada.
2. **Fungsi:** di Supabase > Edge Functions, tempel ulang isi `index.ts` versi 1.3.15 untuk empat fungsi berikut. Nama dan pengaturan Verify JWT tidak berubah:
   - `qiospay-invoice` (Verify JWT nonaktif)
   - `qiospay-lacak` (Verify JWT nonaktif)
   - `qiospay-kasir`
   - `mutasi-webhook` (Verify JWT nonaktif)
   Nama "qiospay-..." tetap dipakai; ketiganya kini melayani QiosPay maupun Mutasiku (aplikasi mengirim penyedia yang dipilih).
3. **Secrets:** tambah `MUTASIKU_API_KEY` dan `MUTASIKU_WALLET_ID` (ID akun GoPay di dashboard Mutasiku).
   `MUTASIKU_WEBHOOK_SECRET` sudah ada jika webhook Mutasiku sudah terpasang.
   Opsional: `MUTASIKU_EXPIRE_MENIT` (masa berlaku QR, default 30, rentang 5 sampai 120), `MUTASIKU_QRIS_TYPE` (default `QRIS-DYNAMIC`, bisa `QRIS`), `MUTASIKU_BASE`.
4. **Webhook Mutasiku:** di dashboard Mutasiku, Settings, Webhooks, alamat `https://<proyek>.supabase.co/functions/v1/mutasi-webhook` harus memakai event **mutations.created** dan **payment.completed**.
5. **Aplikasi:** Pengaturan, Pembayaran & QRIS, Penyedia **Mutasiku QRIS per tagihan (GoPay)**, Simpan Semua Perubahan.

## Uji (urut)
1. **Kasir:** order Rp1.000, Bayar, QRIS. QR muncul. Bayar tepat nominalnya. Order tercatat lunas otomatis.
2. **Toko:** pesanan Rp1.000, Bayar sekarang, bayar. Layar pelanggan jadi centang.
3. **Lacak:** buka nota belum lunas dengan kode tracking di HP lain, Tampilkan QR, bayar.
4. **Log bila gagal** (Supabase > Edge Functions > pilih fungsi > Logs):
   - `mutasiku gagal: 401` API Key salah. `404` ID akun GoPay salah atau alamat API berubah.
   - `respons mutasiku tanpa kode QRIS` Mutasiku membalas dengan format berbeda dari yang diperkirakan. Kirim potongan lognya agar fungsi disesuaikan.
   - `mutasi-webhook` 401 `Signature tidak valid`: `MUTASIKU_WEBHOOK_SECRET` salah atau format tanda tangan berubah.

## Catatan
- Aplikasi memantau pembayaran lewat webhook. Jika Mutasiku terlambat menyinkronkan akun GoPay, pelunasan ikut terlambat. Kasir tetap bisa mencatat manual.
- Sesi login GoPay di Mutasiku bisa kedaluwarsa dan perlu login ulang (OTP). Cek status akun di dashboard Mutasiku bila pembayaran tidak terbaca.
- Fungsi dan secret QiosPay boleh dibiarkan. Jangan aktifkan dua penyedia untuk uang yang sama.
- Nama field respons Mutasiku (kode QR, ID, masa berlaku) dibaca dengan beberapa kemungkinan nama karena dokumen detailnya belum terverifikasi. Uji pertama menentukan.
