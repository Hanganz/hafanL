# Panduan WA Otomatis (Fonnte) - Hafan Laundry v1.1.2

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
4b. **SQL Editor** -> query kosong baru -> tempel `sql/06_migrasi_v6.sql` -> **Run** (wajib sejak v1.1.2; tanpa ini kirim-wa menolak semua pesan).
4b2. **SQL Editor** -> query kosong baru -> tempel `sql/07_migrasi_v7.sql` -> **Run**, lalu **deploy ulang** fungsi `kirim-wa` dengan isi terbaru (wajib; tanpa ini muncul "Akun ini bukan staf" walau Anda owner).
4c. (Opsional, disarankan) Edge Functions -> Secrets -> tambah `ALLOWED_ORIGIN` berisi alamat situs Anda, mis. `https://nama-anda.vercel.app`, agar hanya situs itu yang boleh memanggil fungsi.
5. Di aplikasi (login owner): **Atur -> WA otomatis (Fonnte)** -> centang **Aktifkan**, isi nomor tes, tekan **Kirim pesan tes**, lalu **Simpan**.

## Cara kerjanya
- Pesan dikirim **setelah data berhasil tersimpan**, memakai Template pesan WA yang sama dengan pengiriman manual.
- Satu order tidak dikirimi pesan yang sama dua kali.
- Jika gagal (saldo Fonnte habis, WA terputus, internet mati), muncul pesan dan tombol **Kirim WA** manual tetap bisa dipakai.
- Pelanggan tanpa nomor WA dilewati.

## Pengaman (v1.1.2)
- Pesan hanya dikirim ke nomor yang ada di data order, dan hanya bila WA otomatis aktif dan tersimpan di Pengaturan.
- Maksimal 120 pesan per jam per akun staf. Pesan tes hanya untuk owner.
- Satu pesan per order per jenis; status terkirim disimpan di order sehingga berlaku untuk semua perangkat.

## Catatan penting
- Kirim hanya ke pelanggan yang memang memesan. Pesan massal atau spam bisa membuat nomor pengirim diblokir WhatsApp.
- Jangan pernah menaruh token Fonnte atau kunci `service_role` di `config.js`.
