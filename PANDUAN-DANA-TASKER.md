# Panduan Pembayaran Otomatis dari Notifikasi HP (DANA Bisnis) - Hafan Laundry v1.3.6

Pengganti Mutasiku. HP Android kasir membaca notifikasi **DANA Bisnis** ("Pembayaran QRIS ... diterima Rp ..."), lalu mengirim nominalnya ke Supabase. Selanjutnya sama seperti sebelumnya: pesanan Toko lunas otomatis (centang di layar pelanggan), order kasir dicocokkan oleh aplikasi, sisanya muncul di kartu **Pembayaran masuk (perlu dicek)**.

Tidak ada SQL baru. Aplikasi web tidak perlu diubah selain memakai versi 1.3.6 (untuk tampilan langkah di Pengaturan).

## Cara kerjanya
1. Pembeli scan QR (nominal sudah terisi, mis. Rp35.123 dengan kode unik) dan membayar.
2. DANA Bisnis di HP kasir menampilkan notifikasi uang masuk.
3. Tasker (atau MacroDroid) menangkap notifikasi itu dan mengirim `POST` ke fungsi `notif-webhook` di Supabase.
4. Fungsi memeriksa token, memastikan itu uang masuk (bukan promo, penarikan, dll), mengambil nominalnya, lalu menyimpannya.
5. Pesanan yang nominalnya sama persis otomatis ditandai lunas.

## Yang dibutuhkan
- 1 HP Android (boleh HP lama) yang **menyala terus dan online**, sudah login DANA Bisnis, notifikasinya aktif.
- Tasker (berbayar) atau MacroDroid (ada versi gratis dengan jumlah makro terbatas, cukup untuk satu aturan ini).
- Proyek Supabase yang sudah memakai SQL 09 dan 10 (dari Mutasiku). Kalau belum, jalankan dua file itu dulu.

## A. Pasang fungsi di Supabase (sekali)
1. Supabase, **Edge Functions**, buat fungsi baru bernama persis `notif-webhook`.
2. Tempel seluruh isi `supabase/functions/notif-webhook/index.ts`, lalu **nonaktifkan Verify JWT** untuk fungsi ini. Klik Deploy.
3. **Edge Functions, Secrets**, tambah:
   - `NOTIF_WEBHOOK_TOKEN` = teks acak minimal 32 karakter (huruf dan angka). Simpan, nanti dipakai di HP.
   - (Opsional) `NOTIF_PAKET` = bagian nama paket aplikasi yang diizinkan, mis. `dana`. Kosongkan jika ragu.
4. Alamat fungsi: `https://<proyek-anda>.supabase.co/functions/v1/notif-webhook`. Alamat ini juga tampil di **Pengaturan, Pembayaran & QRIS**, setelah memilih penyedia **HP sendiri (DANA Bisnis)**.

## B. Atur Tasker di HP
1. Android Settings, **Akses notifikasi** (Notification access), aktifkan untuk **Tasker**.
2. Matikan penghemat baterai untuk Tasker dan DANA Bisnis (Baterai, Tanpa batasan). Kunci aplikasi di layar Recent bila ada fitur itu.
3. Di Tasker buat **Profile, Event, UI, Notification**. Isi **Owner Application: DANA Bisnis**. Kolom Title dan Text dikosongkan.
4. Buat **Task** baru berisi satu aksi **Net, HTTP Request**:
   - Method: `POST`
   - URL: alamat fungsi di atas
   - Headers (satu baris per header):
     ```
     x-notif-token:ISI_TOKEN_ANDA
     Content-Type:application/json
     ```
   - Body:
     ```
     {"app":"%anapp","title":"%antitle","text":"%antext"}
     ```
   - Timeout: 30 detik. Centang opsi untuk melanjutkan walau error.
5. Jika teks notifikasi memuat tanda kutip ganda, JSON bisa rusak. Tambahkan aksi **Variable Search Replace** sebelum HTTP Request untuk mengganti `"` menjadi `'` pada `%antext` dan `%antitle`.

### MacroDroid (alternatif)
Trigger: **Notification Received**, aplikasi DANA Bisnis. Aksi: **HTTP Request (POST)** dengan header yang sama dan isi JSON yang sama, memakai variabel (magic text) judul dan isi notifikasi.

## C. Uji
1. **Uji baca (tidak disimpan).** Dari komputer atau Tasker kirim:
   ```
   curl -X POST "https://<proyek-anda>.supabase.co/functions/v1/notif-webhook" \
     -H "x-notif-token: ISI_TOKEN_ANDA" -H "Content-Type: application/json" \
     -d '{"title":"DANA Bisnis","text":"Pembayaran QRIS statis diterima Rp 507 di Hafan Laundry","uji":true}'
   ```
   Hasil yang benar: `{"ok":true,"uji":true,"jumlah":507,...}`. Token salah menghasilkan `401`.
2. **Uji nyata.** Buat order Rp1.000 yang belum lunas, scan QR-nya, bayar. Dalam beberapa detik order lunas atau muncul di kartu Pembayaran masuk.
3. **Kalau notifikasi asli tidak terbaca**, lihat Supabase, Edge Functions, `notif-webhook`, **Logs**. Baris `diabaikan: ...` menampilkan alasan dan teks yang diterima. Kirim teks itu untuk menyesuaikan pembacaan.

## Aturan pembacaan
- Dibaca sebagai uang masuk jika teks memuat kata seperti *diterima, menerima, masuk, pembayaran QRIS* dan ada nominal `Rp`.
- Diabaikan jika memuat kata seperti *penarikan, pencairan, settlement, top up, refund, gagal, promo, cashback, voucher, tagihan*.
- Nominal dengan format `Rp 50.012`, `Rp50.012,00`, `Rp 507.` dibaca benar.
- Notifikasi yang sama (nominal dan teks sama) dalam 90 detik dihitung satu pembayaran, supaya pembaruan notifikasi atau kirim ulang Tasker tidak menggandakan.

## Penting
- **Jangan aktifkan Mutasiku dan HP bersamaan** untuk rekening yang sama, supaya satu pembayaran tidak tercatat dua kali. Matikan webhook di Mutasiku.
- Ini bukan konfirmasi resmi dari penyedia pembayaran, melainkan pembacaan notifikasi. Jika HP mati, offline, atau notifikasi tidak muncul, pembayaran tidak terdeteksi. Kasir tetap bisa mencatat manual.
- Notifikasi yang masuk saat HP offline tidak dikirim ulang otomatis. Untuk menambah ketahanan, tambahkan pengulangan sederhana di Tasker (aman, ada pencegah ganda).
- Pesanan Toko dicocokkan lewat nominal unik. Pembayaran dengan nominal yang tidak persis sama tidak otomatis lunas.
- Token hanya disimpan di Supabase Secrets dan di HP. Jangan tampilkan di tangkapan layar. Untuk mengganti token, ubah secret di Supabase lalu ubah di Tasker.
- Yang disimpan hanya nominal dan teks notifikasinya (bisa memuat nama pembayar). Antrean otomatis dihapus setelah 90 hari.
