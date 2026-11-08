# Panduan Pasang Ulang Bersih - Hafan Laundry v1.3.10

Tujuan: membuang semua fungsi lama di database (sumber error `column reference "k" is ambiguous` saat Lacak) dan memasang versi terbaru yang konsisten, tanpa kehilangan data.

## Hasil evaluasi file (ringkas)
- **SQL:** 47 fungsi diperiksa satu per satu. Tidak ada yang memakai variabel yang bentrok dengan nama kolom pada pernyataan SQL-nya. `kl_lacak_kode` dan `kl_lacak_nota` di file kita sudah aman (variabel `v_k`, kolom diberi nama tabel).
- **Penyebab paling mungkin error berulang:** database masih menyimpan fungsi `kl_lacak_kode` versi lama. Jika `create or replace` gagal atau tidak sampai dijalankan (mis. SQL lama dijalankan ulang, atau skrip berhenti karena error di tengah), versi lama tetap dipakai. Ini tidak bisa diperiksa dari file; skrip uji (`13_uji_setelah_pasang.sql`) yang memastikannya.
- **Perbaikan di v1.3.9:** semua fungsi `kl_*` dihapus lalu dibuat ulang dalam **satu transaksi** (gagal di tengah = dibatalkan, tidak setengah terpasang).
- **Keamanan file:** kunci yang ada di `config.js` hanya kunci anon (publik, memang boleh terlihat). Tidak ada service_role, API Key, atau token lain di kode web. CSP sudah mengizinkan pemanggilan Supabase.
- **Bug yang sudah diperbaiki di versi sebelumnya:** bentrok nama kelas CSS `.pkr` (daftar produk kasir) pada v1.3.2 sampai v1.3.3.

## Jalur A: pasang ulang di database yang sama (data aman)
1. **Cadangkan dulu:** buka aplikasi, Pengaturan, Toko & Akses, **Unduh cadangan**. Simpan filenya.
2. Buka `sql/00_PASANG_SEMUA.sql`. Cari `GANTI_DENGAN_EMAIL_ADMIN` dan ganti dengan email admin (boleh dibiarkan jika admin sudah terdaftar).
3. Supabase, **SQL Editor, New query kosong**, tempel seluruh isi file, **Run**.
   - Berhasil: tampil "Success. No rows returned".
   - Jika ada error, tidak ada yang berubah (transaksi dibatalkan). Kirim pesan errornya.
4. Jalankan `sql/13_uji_setelah_pasang.sql`. **Semua baris harus OK**, terutama "Lacak lewat kode tracking".
5. **Edge Functions:** tempel ulang kode terbaru dan Deploy: `kirim-wa`, `mutasi-webhook` (jika masih dipakai), `notif-webhook` (jika memakai HP), `qiospay-invoice`, `qiospay-kasir`, `qiospay-hook`, dan **baru:** `qiospay-lacak` (buat fungsi baru, **Verify JWT dimatikan**). Secrets tidak berubah.
6. **Web:** timpa isi project dengan zip v1.3.10, push ke GitHub (Vercel deploy otomatis).
7. Uji: buka halaman Lacak dengan kode tracking yang ada. Jika masih error, jalankan `13_uji_setelah_pasang.sql` dan kirim hasilnya.

## Jalur B: proyek Supabase baru (mulai dari nol)
1. Buat proyek Supabase baru. Authentication, Users, **Add user** (email dan kata sandi kuat, centang Auto Confirm User).
2. Jalankan `00_PASANG_SEMUA.sql` dengan email admin tadi, lalu `13_uji_setelah_pasang.sql`.
3. Isi `config.js` dengan **Project URL** dan **anon key** proyek baru (Project Settings, API). Jangan memakai service_role.
4. Buat Edge Functions dan Secrets sesuai PANDUAN-FONNTE.md dan PANDUAN-QIOSPAY.md.
5. Pulihkan data dari file cadangan: Pengaturan, **Pulihkan dari JSON**.
6. Push web ke GitHub/Vercel.

## Setelah ini
- Jangan menjalankan file SQL lama satu per satu. Untuk perubahan di masa depan, selalu pakai `00_PASANG_SEMUA.sql` terbaru (aman diulang).
- Jika Lacak error lagi, jalankan `13_uji_setelah_pasang.sql`; baris yang GAGAL menunjukkan penyebabnya.
