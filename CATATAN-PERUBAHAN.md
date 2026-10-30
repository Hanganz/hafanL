# Catatan Perubahan Hafan Laundry

Pakai versi terbaru (**v1.1**). Isinya sudah mencakup semua perubahan di bawah.

## v1.1.1 - Keamanan header (CSP)
- CSP diperketat: `default-src 'none'`, `script-src 'self' https://cdnjs.cloudflare.com` (tanpa `unsafe-inline` untuk skrip), `style-src` tanpa `unsafe-inline` untuk elemen `<style>`. Atribut `onclick=` dan `style=` masih diizinkan lewat `script-src-attr` dan `style-src-attr` karena aplikasi memakainya di ratusan tempat.
- Skrip penangkap error dipindah dari `index.html` ke `err.js` (tidak ada lagi skrip inline).
- Tambah `Cross-Origin-Opener-Policy: same-origin` dan `upgrade-insecure-requests`.
- `tambah-sri.sh`: menambah SRI ke tiga skrip CDN (jalankan sekali di komputer).

## v1.1 - WA otomatis, tanpa masuk ulang, tampilan lebih segar
- `config.js` sudah berisi URL dan kunci anon Supabase proyek Anda.
- **Tanpa masuk ulang**: `INGAT_LOGIN: true`. Login staf diingat di perangkat dan diperpanjang otomatis. Pakai hanya di perangkat toko; tombol Keluar tetap menghapusnya.
- Simpan cepat: tidak memuat ulang halaman, hanya mengirim bagian yang berubah (sudah ada sejak v2).
- **WA otomatis (Fonnte)**: Atur -> WA otomatis. Pesan terkirim saat order baru dan saat cucian selesai, setelah data tersimpan. Panduan: `PANDUAN-FONNTE.md`. File baru: `supabase/functions/kirim-wa/index.ts`.
- **Tampilan**: latar gradasi lembut, kartu dengan bayangan halus, tombol gradasi, kolom isian dengan cincin fokus, transisi halaman. Semua ada di bagian akhir `style.css` (blok "v1.1 POLES TAMPILAN").
- Wajib: jalankan `sql/05_migrasi_v5.sql` (setelah v2, v3, v4). Kasir tidak bisa mengubah pengaturan WA otomatis.

## v13 - Pesanan online otomatis + laporan visual
**Pesanan online (tanpa WhatsApp)**
- Halaman Toko: tombol **Kirim Pesanan** langsung mengirim pesanan ke kasir. Tombol WhatsApp tetap ada sebagai cadangan.
- Setelah kirim, pelanggan dapat kode pesanan (mis. P7K2QX) dan status "Menunggu / Diterima / Ditolak" tampil di halaman Toko, lengkap dengan kode lacak saat diterima.
- Kasir: kotak **Pesanan online** muncul di paling atas Beranda dan tab Order, dengan tombol Terima / Tolak. Terima = otomatis jadi order (stok berkurang, pelanggan tersimpan).
- Cek pesanan baru tiap 30 detik, bunyi + getar + angka di judul tab saat ada pesanan baru.
- Atur -> **Pesanan online**: centang "Terima pesanan online otomatis" (jika stok cukup).
- Harga dan stok dihitung ulang di server (pelanggan tidak bisa mengubah harga). Dibatasi 30 pesanan/jam total dan 5/jam per nomor/nama.
- Dua perangkat tidak bisa menerima pesanan yang sama (sistem klaim).
- Tombol "Tempel WA" di kasir dihapus (digantikan fitur ini).
**Laporan & tampilan**
- Laporan: kartu ringkasan berwarna, grafik area di atas, diagram donat metode bayar, diagram batang layanan terlaris, jam tersibuk, dan per karyawan.
- Beranda kasir: kartu "Stok produk menipis" otomatis.
- Strip "Produk Kami" di beranda pelanggan memakai foto persegi.
**Wajib:** jalankan `sql/04_migrasi_v4.sql` di Supabase SQL Editor (setelah v2 dan v3).
- File yang berubah dari v12: `app.js`, `style.css`. File baru: `sql/04_migrasi_v4.sql`.

## v12 - Halaman Toko gaya marketplace (Shopee/Tokopedia)
- Kolom cari produk di atas + ikon keranjang dengan angka jumlah item.
- Kartu info toko (logo, nama, rating dari ulasan, jam buka).
- Tombol urut: Semua / Termurah / Termahal / Tersedia.
- Grid produk dengan foto besar, harga tebal, label "Sisa N" (stok menipis), overlay "Habis", tombol + bulat / stepper.
- Ketuk produk -> halaman detail (foto besar, harga, stok, tambah ke keranjang).
- Perbaikan bug lama: bar keranjang di bawah dulu ikut menempel ke dasar halaman (tidak terlihat jika produk banyak). Sekarang selalu menempel di layar.
- File yang berubah dari v11: `app.js` dan `style.css`.

## v11 - Cetak struk ke printer thermal Bluetooth
- Tombol baru **🖨 Cetak** di detail order dan di menu order. Tombol lama 🧾 berganti nama jadi **Struk** (kirim struk sebagai gambar).
- Atur -> **Printer thermal Bluetooth**: pilih lebar kertas (58 / 80 mm) dan tombol "Hubungkan & tes cetak". Pengaturan tersimpan per perangkat.
- Struk dicetak sama persis dengan nota (logo, alamat, QR, cap LUNAS).
- Syarat: Chrome (Android / desktop) dan printer Bluetooth **LE (BLE)**. Printer Bluetooth klasik (SPP) tidak didukung browser.
- Belum dicoba dengan printer asli, hanya dengan printer tiruan. Jika gagal, catat merek/tipe printer dan pesan errornya.
- File yang berubah dari v10: hanya `app.js`.

## v10 - Admin testimoni disederhanakan
- Dihapus dari Data -> Testimoni: form "Terima testimoni (tempel kode)" dan "Tambah testimoni manual" (sudah tidak dipakai).
- Yang tersisa: daftar testimoni masuk otomatis (Setujui / Sembunyikan / Hapus) dan, kalau ada, "Testimoni lama" yang bisa disembunyikan atau dihapus.
- File yang berubah dari v9: hanya `app.js`.

## v9 - Penangkap error di index.html
- `index.html` sekarang menampilkan kotak merah berisi pesan error jika aplikasi gagal jalan (tidak lagi layar kosong).

## v9 - Testimoni harus disetujui dulu
- Testimoni dari pelanggan masuk antrean "Menunggu", belum tampil di beranda.
- Data -> Testimoni: tombol **Setujui & tampilkan** dan **Tolak & hapus** (hanya owner).
- Setelah disetujui, bisa **Sembunyikan** / **Tampilkan** lagi.
- `sql/03_migrasi_v3.sql` ikut berubah. Jalankan ulang di Supabase SQL Editor (aman diulang, data tidak hilang).

## v8 - Struk digital
- Tanggal: `28 Okt 2026, 23:46` (tanggal, bulan, tahun, lalu jam:menit).
- WA pelanggan boleh dikosongkan, tercetak `-`. Label struk: "WA Toko" (header) dan "WA PELANGGAN".
- Jumlah / timbangan bisa desimal (`1,3` atau `1.3`), total dihitung akurat. Tampil `1,3 kg` di struk.
- Alamat toko di header turun ke baris baru dan tercetak lengkap.
- Metode bayar di baris sendiri: `METODE BAYAR  QRIS`.
- TOTAL lebih besar, tebal, dengan blok abu-abu.
- Teks "STATUS LUNAS" dihapus, cap hijau LUNAS dipertahankan. Jika belum lunas muncul `SISA BAYAR`.
- Baris baru `EST. SELESAI`, dan `DIAMBIL` jika order sudah diambil.
- Teks QR: "Scan QR Code untuk cek status cucian Anda", lalu kode lacak.
- Footer: Instagram (dari menu Atur) dan Syarat & Ketentuan (komplain maksimal 1x24 jam).
  Teks S&K ditulis langsung di app.js (fungsi `nota`), belum ada di menu Atur.

## v7 - Perbaikan umum
- Bug logo: bentrok nama class CSS (`.sm`, `.fc`) sudah diganti. Logo di footer tengah dan tidak nabrak garis.
  Logo tidak dipotong lagi saat upload. Upload ulang logo sekali agar logo lama yang sudah terpotong tergantikan.
- Grafik dashboard: grafik area halus bergaya "Penerimaan pembayaran", ada tombol Garis/Batang, default "Uang masuk".
- Nota: alamat lengkap, huruf kecil, dibungkus ke beberapa baris.
- Foto produk: Atur -> Produk -> Tambah foto. Tampil di Beranda, Toko, keranjang, dan kasir.
- Testimoni otomatis lewat form pelanggan (butuh `sql/03_migrasi_v3.sql`).

## Yang harus dijalankan di Supabase
Urutan: `sql/01_keamanan.sql` -> `sql/02_migrasi_v2.sql` -> `sql/03_migrasi_v3.sql` -> `sql/04_migrasi_v4.sql`.
Yang sudah pernah dijalankan tidak perlu dihapus. Untuk v9, jalankan ulang v3 yang baru.

## Setelah deploy
- Isi `config.js` dengan URL dan key Supabase yang dipakai sekarang (file ini bawaan zip masih kosong).
- Muat ulang paksa di browser agar cache lama tidak terpakai.
