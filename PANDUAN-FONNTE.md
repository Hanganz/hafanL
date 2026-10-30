# Panduan WA Otomatis (Fonnte) - Hafan Laundry v1.1

Fitur ini mengirim WhatsApp ke pelanggan otomatis (order baru dan cucian selesai) tanpa klik tombol Kirim WA.
Fonnte adalah layanan pihak ketiga berbayar. Cek paket dan harga terbaru di fonnte.com.
Token Fonnte disimpan di Supabase (rahasia), bukan di file web.

## Langkah (sekali saja)
1. **Fonnte**: daftar di fonnte.com, tambah *Device*, scan QR dengan WhatsApp pengirim (disarankan nomor khusus laundry),
   lalu salin **Token** device.
2. **Supabase** -> menu **Edge Functions** -> **Deploy a new function** (via Editor).
   Nama fungsi harus persis: `kirim-wa`. Tempel isi file `supabase/functions/kirim-wa/index.ts`, lalu **Deploy**.
3. Supabase -> **Edge Functions** -> **Secrets** -> tambah: nama `FONNTE_TOKEN`, isi token dari langkah 1.
4. Supabase -> **SQL Editor** -> **New query** kosong -> tempel `sql/05_migrasi_v5.sql` -> **Run**.
5. Di aplikasi (login owner): **Atur -> WA otomatis (Fonnte)** -> centang **Aktifkan**, isi nomor tes, tekan **Kirim pesan tes**, lalu **Simpan**.

## Cara kerjanya
- Pesan dikirim **setelah data berhasil tersimpan**, memakai Template pesan WA yang sama dengan pengiriman manual.
- Satu order tidak dikirimi pesan yang sama dua kali.
- Jika gagal (saldo Fonnte habis, WA terputus, internet mati), muncul pesan dan tombol **Kirim WA** manual tetap bisa dipakai.
- Pelanggan tanpa nomor WA dilewati.

## Catatan penting
- Kirim hanya ke pelanggan yang memang memesan. Pesan massal atau spam bisa membuat nomor pengirim diblokir WhatsApp.
- Jangan pernah menaruh token Fonnte atau kunci `service_role` di `config.js`.
