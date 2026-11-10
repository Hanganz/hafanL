# Catatan Perubahan Hafan Laundry

## v1.3.12 - Halaman Profile premium (dark mode, bottom sheet, animasi)
- **Berkas baru:** `profile.js` (modul `window.PF`) dan `profile.css` (semua aturan ber-scope `.pf` / `.pf-*`, tidak mengubah halaman lain). Dimuat di index.html sebelum `app.js`.
- **Staf (menu Profil):** header foto lingkaran dengan cincin gradien, nama, username, email, badge peran dan status akun, tombol Edit profil. Informasi pribadi (nama, username, email, telepon, tanggal bergabung, bio) dibaca dan disimpan di Supabase Auth (`user_metadata`), tanpa SQL baru. Pintasan lama (Pengaturan, Laporan, Stok, Pusat Data, Hutang) tetap ada.
- **Pelanggan (menu Akun):** header dan menu yang sama; poin, riwayat cucian, layanan favorit, dan bantuan lama tetap ada. Bio dan foto disimpan di perangkat. Ganti kata sandi pelanggan diarahkan ke admin (WA) karena tidak ada fungsi server untuk itu.
- **Fitur:** edit profil (bottom sheet + validasi), ganti foto (potong dan zoom, disimpan di perangkat), ganti kata sandi (verifikasi sandi lama, indikator kekuatan), privasi (samarkan email/telepon, sembunyikan foto), notifikasi (getar, pengingat cucian terlambat, notifikasi sistem), keamanan akun (login terakhir, keluar dari semua perangkat), riwayat aktivitas (filter), pusat bantuan (FAQ), tentang, keluar.
- **Penyesuaian ke screenshot referensi:** ikon seragam satu warna aksen, cincin progres kelengkapan profil di sekeliling foto, menu dikelompokkan (Personalisasi, Pengingat, Privasi dan keamanan, Lainnya) dengan subjudul status, dan sheet **Tampilan** (tema aplikasi, 5 warna aksen, ukuran teks, gaya sudut) dengan bar "N perubahan / Buang / Simpan". Pilihan disimpan di akun (staf) atau perangkat (pelanggan).
- Toast, animasi buka halaman bertahap, skeleton loading, dan bottom sheet dengan geser untuk menutup. Menghormati `prefers-reduced-motion`.
- `app.js`: `dProf()` dan `dAkun()` memakai modul baru; `draw()` memanggil `PF.sync()`; getar mengikuti pengaturan notifikasi; avatar di header admin menampilkan foto bila ada.
- Tidak ada perubahan SQL atau Edge Function. Versi berkas statis naik ke `?v=1.3.12`.

## v1.3.11 - Perbaikan izin database dan WA lunas otomatis dari QiosPay
- **"Gagal membaca nota" di Lacak** dan **"Khusus staf yang sedang login" di QRIS kasir:** fungsi Edge (role `service_role`) tidak punya izin membaca tabel `kl_lacak` dan `kl_staf` pada project Supabase yang baru. **SQL baru `sql/15_izin_service_role.sql`** memberi izin `service_role` ke tabel dan sequence di schema `public`.
- **`qiospay-kasir`** memeriksa staf lewat fungsi `kl_peran_staf` (cadangan: baca tabel langsung).
- **WA bukti lunas ke pembeli:** tagihan ke QiosPay kini menyertakan `whatsapp_buyer` (format 62..., nomor tamu `620000...` diabaikan). Berlaku di `qiospay-lacak`, `qiospay-kasir`, dan `qiospay-invoice`. Sebelumnya QiosPay menulis "nomor WA pembeli kosong" dan tidak mengirim WA.
- **SQL baru `sql/16_wa_lacak.sql`:** kolom `kl_lacak.wa` (nomor lengkap, hanya terbaca fungsi Edge) dan `kl_sinkron_publik` diperbarui. Aplikasi kasir mengirim nomor itu saat sinkron (`sbProyeksi`).
- **Isi pesan WA:** `{keterangan}` kini berisi nomor nota asli dan nama pelanggan (`Nota ORD-... a.n. Nama`). Teks template yang disarankan ada di PANDUAN-QIOSPAY.md.
- `13_uji_setelah_pasang.sql` menambah cek kolom `wa` dan izin `service_role`. `00_PASANG_SEMUA.sql` kini juga memuat 15 dan 16.
- Versi berkas statis naik ke `?v=1.3.11` supaya browser tidak memakai `app.js` lama.
- Wajib: jalankan `00_PASANG_SEMUA.sql` (atau 15 lalu 16), deploy ulang `qiospay-lacak`, `qiospay-kasir`, `qiospay-invoice`, deploy web, lalu buka kasir dan simpan sekali.
- Belum diperbaiki: catatan pembayaran Lacak memakai nominal plus kode unik (mis. Rp2.608 untuk nota Rp2.000). Perlu keputusan cara pencatatan.
- File yang berubah: sql/15 dan sql/16 (baru), sql/00_PASANG_SEMUA.sql, sql/13_uji_setelah_pasang.sql, sql/00_BACA_DULU.txt, supabase/functions/qiospay-lacak, qiospay-kasir, qiospay-invoice, app.js, index.html, config.js, PANDUAN-QIOSPAY.md, PANDUAN-PASANG-ULANG.md.

## v1.3.10 - QRIS QiosPay di halaman Lacak (pelanggan bayar nota laundry)
- **Masalah:** di mode QiosPay, kartu Bayar via QRIS di halaman Lacak tidak muncul (atau memakai QRIS statis yang tidak terdeteksi QiosPay), karena pelanggan tidak menerima pengaturan penyedia (`mutProv` khusus owner) dan fungsi `qiospay-kasir` hanya untuk staf.
- **Fungsi baru `qiospay-lacak`** (publik, Verify JWT dimatikan): membuat tagihan QRIS QiosPay untuk **sisa bayar** nota berdasarkan kode tracking. Nominal diambil dari data nota di database, bukan dari pelanggan. Idempoten (QR yang masih berlaku dipakai ulang), tagihan baru otomatis bila kedaluwarsa atau nominalnya berubah (mis. setelah DP). Bila sudah dibayar tetapi belum dicatat kasir, tidak dibuat tagihan baru (cegah bayar dua kali).
- **SQL baru `sql/14_migrasi_lacak_qiospay.sql`** (sudah termasuk di `00_PASANG_SEMUA.sql`): tabel `kl_lacak_qp`, fungsi `kl_lacak_bayar_status` (dipanggil pelanggan tiap 5 detik), dan `kl_qiospay_lunas` diperluas untuk referensi `L-<KODE>-R<n>`.
- **Aplikasi (pelanggan):** kartu Bayar via QRIS di Lacak kini memakai flag publik `pm.qp`. Tombol Tampilkan QR menampilkan QR QiosPay dengan nominal plus kode unik, hitung mundur, dan **berubah sendiri jadi centang** begitu webhook QiosPay masuk, tanpa kasir perlu terbuka. Dibuka ulang setelah membayar tetap menampilkan centang. Status dan kartu Sisa bayar ikut menjadi Lunas.
- **Aplikasi (kasir):** uang masuk dari tagihan Lacak dicocokkan ke nota lewat kode tracking pada referensi (`L-<KODE>`), lalu dicatat otomatis saat aplikasi kasir terbuka. Uang yang tidak cocok tetap masuk kartu Pembayaran masuk (perlu dicek).
- Mode Mutasiku dan HP sendiri (DANA Bisnis) tidak berubah.
- Wajib: jalankan ulang `00_PASANG_SEMUA.sql` (atau hanya `14_migrasi_lacak_qiospay.sql`), pasang fungsi `qiospay-lacak` dengan **Verify JWT dimatikan**, lalu `13_uji_setelah_pasang.sql`.
- File yang berubah: sql/14_migrasi_lacak_qiospay.sql (baru), sql/00_PASANG_SEMUA.sql, sql/13_uji_setelah_pasang.sql, sql/00_BACA_DULU.txt, supabase/functions/qiospay-lacak (baru), app.js, index.html, config.js, PANDUAN-QIOSPAY.md, PANDUAN-PASANG-ULANG.md.

## v1.3.9 - Pasang ulang bersih dan QiosPay di kasir
- **SQL pasang ulang:** `sql/00_PASANG_SEMUA.sql` (01 sampai 10 dan 12 dalam satu transaksi). Menghapus semua fungsi `kl_*` lama lalu membuat ulang, data tidak dihapus. Bila ada error di tengah, semuanya dibatalkan. Untuk menutup penyebab berulangnya error Lacak `column reference "k" is ambiguous`.
- **`sql/13_uji_setelah_pasang.sql`:** menguji Lacak kode dan nota, RLS, izin, fungsi penting, dan mendeteksi fungsi lama yang berbahaya.
- `sql/11_perbaikan_lacak.sql` kini menghapus versi lama dulu sebelum membuat ulang.
- **QiosPay di kasir:** fungsi baru `qiospay-kasir` (khusus staf login) membuat tagihan untuk popup Bayar via QRIS dan tombol Tampilkan QR di detail order. Pembayaran dicocokkan lewat referensi `N-<id>-<kode>`, bukan menebak nominal.
- Struk tidak mencetak QR statis di mode QiosPay. Tombol QRIS Isi Saldo disembunyikan di mode QiosPay.
- Panduan baru: PANDUAN-PASANG-ULANG.md. PANDUAN-QIOSPAY.md diperbarui.
- File yang berubah: sql/00_PASANG_SEMUA.sql, sql/13_uji_setelah_pasang.sql, sql/11, sql/00_BACA_DULU.txt, supabase/functions/qiospay-kasir (baru), app.js, panduan, index.html, config.js.

## v1.3.8 - Pembayaran pesanan online lewat QiosPay (qiospay.com), pengganti Mutasiku
- Menggantikan percobaan v1.3.7 (yang dibuat untuk qiospay.id dan sudah dihapus dari project). Versi ini memakai gateway **qiospay.com** dengan Open API.
- **Fungsi baru `qiospay-invoice`**: membuat tagihan QRIS dinamis di QiosPay untuk satu pesanan Toko (nominal dari database), idempoten, tagihan baru otomatis bila kedaluwarsa.
- **Fungsi baru `qiospay-hook`**: menerima webhook `invoice.paid`, memverifikasi tanda tangan HMAC-SHA256, lalu menandai pesanan lunas berdasarkan kode pesanan.
- **SQL baru `sql/12_migrasi_qiospay.sql`**: kolom qp_id, qp_qris, qp_url, qp_n pada kl_pesan, dan fungsi `kl_qiospay_lunas`.
- Aplikasi: penyedia baru **QiosPay (qiospay.com)** di Pengaturan, Pembayaran & QRIS. Memilihnya menyalakan bendera publik `pm.qp`. Layar bayar pelanggan memakai QR dari QiosPay, dan otomatis kembali ke cara lama bila fungsi belum disiapkan di server.
- Pembayaran di kasir (struk, Hutang, Jual, Isi saldo) belum berubah dan masih memakai QRIS statis.
- Panduan: PANDUAN-QIOSPAY.md.
- File yang berubah: sql/12_migrasi_qiospay.sql, supabase/functions/qiospay-invoice, supabase/functions/qiospay-hook, PANDUAN-QIOSPAY.md, app.js, index.html, config.js.

## v1.3.6 - Pembayaran otomatis dari notifikasi HP (DANA Bisnis), pengganti Mutasiku
- **Fungsi baru `notif-webhook`** (Supabase Edge Function): menerima teks notifikasi dari Tasker atau MacroDroid, memastikan itu uang masuk, mengambil nominalnya, lalu memakai alur yang sama dengan Mutasiku (`kl_mutasi_masuk`). Tidak ada SQL baru.
- Dijaga token rahasia (`NOTIF_WEBHOOK_TOKEN`), pencegah ganda 90 detik, mode uji (`"uji": true`), dan log alasan notifikasi yang diabaikan.
- Pengaturan, Pembayaran & QRIS: ada penyedia baru **HP sendiri (DANA Bisnis)** dengan alamat dan 7 langkah pemasangan sendiri.
- Catatan pembayaran otomatis kini menyebut sumbernya (Mutasiku atau DANA Bisnis HP).
- Panduan baru: PANDUAN-DANA-TASKER.md.
- File yang berubah: supabase/functions/notif-webhook/index.ts (baru), PANDUAN-DANA-TASKER.md (baru), app.js, index.html, config.js.

## v1.3.5 - Perbaikan error Lacak
- Error `Gagal (400): column reference "k" is ambiguous` saat Lacak Cucian berasal dari fungsi `kl_lacak_kode` versi lama di database. Ditambahkan **sql/11_perbaikan_lacak.sql** (aman diulang, tidak mengubah data).
- Pesan error di halaman Lacak kini menjelaskan penyebab dan langkah perbaikannya.
- File yang berubah: sql/11_perbaikan_lacak.sql (baru), sql/00_BACA_DULU.txt, app.js, index.html, config.js.

## v1.3.4 - Set ikon pastel baru
- **66 ikon baru** bergaya pastel minimalis (tile membulat, garis tebal dua warna, aksen kecil), mengikuti gambar referensi. Tersedia versi terang dan gelap.
- File baru: **icons.js** (perpustakaan ikon). Dimuat di index.html sebelum app.js.
- Dipasang di: beranda pelanggan (Lacak, Harga, Toko, CS, Lokasi, Bagikan, Ulasan, Akun), beranda admin (Order Baru, Order, Jual, Pelanggan, Hutang, Laporan, Stok, Lainnya, Rekap, Data, Pengaturan), Pengaturan owner, ikon jenis layanan (kiloan, setrika, sepatu, karpet, selimut, gorden, boneka, kilat, baju), serta halaman Profil/Akun.
- Status cucian di Akun pelanggan memakai ikon (Diterima, Diproses, Selesai, Diambil, Batal).
- **Perbaikan**: kelas CSS `.pkr` pada profil bentrok dengan daftar produk di kasir. Nama kelas profil diganti `.pkw`, daftar produk kembali seperti semula.
- Tidak ada perubahan SQL.
- File yang berubah: icons.js (baru), app.js, style.css, index.html, config.js.

## v1.3.3 - Profil gaya baru untuk pelanggan, kasir, dan owner
- **Tampilan baru mengikuti referensi**: avatar besar dengan ring progres, nama tebal, kartu statistik 3 kolom, label seksi huruf kapital, dan daftar berkelompok (ikon berwarna, judul, keterangan, panah).
- **Pelanggan (Akun)**: ring avatar menunjukkan progres poin menuju diskon Rp25.000. Statistik Poin, Saldo, Total cucian. Seksi Poin member, Sedang berjalan, Riwayat cucian (5 terbaru, tombol Tampilkan semua), Layanan yang sering dipakai, Bantuan, Tampilan, dan Keluar dengan konfirmasi.
- **Kasir dan Owner**: halaman **Profil** (/dashboard/profile). Ring avatar menunjukkan order selesai hari ini. Statistik sesuai peran (owner: omzet, order, uang masuk; kasir: order saya, diproses, siap diambil), Akses Anda, Pintasan (termasuk Hutang), Informasi akun, Tampilan, dan Keluar.
- **Tampilan**: saklar Mode gelap dan saklar Ikuti perangkat.
- Tombol Keluar di header diganti tombol avatar yang membuka Profil.
- Tidak ada perubahan SQL.
- File yang berubah: app.js, style.css, index.html, config.js.

## v1.3.1 - Lacak berubah jadi centang otomatis, tanpa kedip, alamat halaman, login lebih tahan
- **Lacak (pelanggan)**: kartu Bayar via QRIS dicek ulang tiap 5 detik selama belum lunas. Begitu pembayaran tercatat, kartu berubah sendiri jadi centang Pembayaran diterima, tanpa muat ulang. Setelah muat ulang atau dibuka lagi, pesanan yang sudah lunas langsung menampilkan centang itu. Tidak ada perubahan SQL.
- **Aplikasi kasir**: uang masuk (Mutasiku) diperiksa tiap 15 detik (sebelumnya 45 detik) supaya centang di halaman Lacak lebih cepat muncul. Centang muncul setelah aplikasi kasir mencatat pembayaran (perlu terbuka di satu perangkat).
- **Tanpa kedip**: layar tidak lagi memudar atau seperti reload tiap simpan, bayar, atau polling. Layar yang isinya sama tidak disentuh, dan redraw ditunda saat sedang mengetik. Navbar tidak ikut animasi pindah halaman.
- **Alamat per halaman**: staf /dashboard, /dashboard/orders, /dashboard/orders/new, /dashboard/orders/history, /dashboard/customers, /dashboard/debts, /dashboard/inventory, /dashboard/reports, /dashboard/settings, /dashboard/data. Pelanggan /, /track, /shop, /pricing, /info, /account, /login, /register. Alamat lama tetap diterima. Wajib: vercel.json berisi rewrites.
- **Login lebih tahan**: token diperbarui ulang dengan aman, sesi tidak langsung hilang karena satu kali 401, dan simpan yang kena 401 dicoba ulang sekali.
- File yang berubah: app.js, style.css, index.html, vercel.json, config.js.

## v1.3.0 - Bayar QRIS dengan batas waktu dan centang otomatis
- **Pelanggan (Toko)**: layar Pembayaran dengan QR bernominal unik (total + kode unik), hitung mundur 60 menit, dan centang otomatis begitu uang masuk (periksa tiap 5 detik, tanpa relog). Setelah lunas layar terkunci dengan centang dan QR tidak muncul lagi. Waktu habis: Buat QR baru atau bayar di toko. Label Dibayar di Pesanan saya.
- **Server**: pencocokan uang masuk ke pesanan online dilakukan di Supabase (fungsi webhook), tidak bergantung pada aplikasi kasir yang terbuka.
- **Kasir**: QR QRIS memakai kode unik dan hitung mundur 15 menit. Uang masuk dicocokkan tiap 4 detik, lalu muncul centang dan layar menutup sendiri. Order yang sudah lunas tidak bisa dibayar lagi.
- Order online yang dibayar otomatis tercatat lunas di aplikasi kasir.
- Wajib: jalankan `sql/10_migrasi_v10.sql` (setelah 01-09). Fungsi Edge `mutasi-webhook` tidak berubah.

## v1.2.0 - Pembayaran masuk otomatis (Mutasiku)
- Uang yang masuk ke akun Mutasiku dicocokkan otomatis ke order belum lunas dengan nominal yang sama persis (hanya jika cocok dengan tepat satu order), lalu dicatat sebagai pembayaran dan masuk log aktivitas.
- Kartu **Pembayaran masuk (perlu dicek)** di Beranda untuk yang tidak cocok atau ambigu: pilih order atau Abaikan (juga Abaikan semua).
- Pengaturan -> Pembayaran & QRIS -> Mutasi bank otomatis: alamat webhook terisi otomatis dengan tombol Salin, dan langkah pemasangan diganti dengan langkah yang benar untuk Supabase.
- File baru: `supabase/functions/mutasi-webhook/index.ts` (penerima webhook, verifikasi tanda tangan HMAC-SHA256), `sql/09_migrasi_v9.sql`, `PANDUAN-MUTASIKU.md`.
- Wajib: jalankan SQL 09, pasang fungsi `mutasi-webhook` (Verify JWT dimatikan), isi secret `MUTASIKU_WEBHOOK_SECRET`.

## v1.1.9 - Toko ala marketplace (tahap 1)
- **Pesanan saya**: tombol struk di bagian atas halaman Toko membuka daftar pesanan pelanggan (disimpan di perangkatnya) dengan langkah bertahap **Dikirim - Diterima - Siap - Selesai**, status ditolak/dibatalkan, tombol **Lacak**, dan tombol **Beri ulasan** setelah selesai. Setelah kirim pesanan, ada tombol "Lihat pesanan saya".
- **Urut produk**: tambah chip **Terlaris** dan **Terbaru** (di samping Termurah, Termahal, Tersedia).
- **Terjual**: jumlah terjual per produk dihitung otomatis dari order (tidak termasuk yang dibatalkan) saat staf menyimpan, tampil di kartu produk.
- **Ulasan per produk**: pelanggan memberi bintang dan komentar untuk produk yang dibeli. Ulasan tampil di detail produk, dan rata-rata bintang tampil di kartu produk, setelah owner menyetujui di Data -> Testimoni (nama produk ikut tampil di sana). Ulasan produk tidak ikut menghitung rating toko.
- Wajib: jalankan `sql/08_migrasi_v8.sql` (setelah 01-07). Tanpa itu, tombol kirim ulasan produk menampilkan pesan "belum aktif di server".
- Belum ada (tahap berikutnya): pilihan metode pembayaran, kode voucher, ongkir.

## v1.1.8 - Menu Stok (tambah/kurang) dan Pengaturan lebih ringkas
- **Menu Stok baru** (kotak "Stok" di beranda admin, dengan angka merah jika ada produk menipis). Tiap produk punya tombol **-** dan **+**, kolom jumlah yang bisa diketik, dan tombol cepat +5 / +10 / +20. Perubahan tersimpan otomatis (jeda sekitar 1 detik). Setiap perubahan stok tercatat di log aktivitas.
- Pengelolaan produk (nama, harga, foto, nonaktifkan, hapus, tambah) dan pengaturan **Pesanan online** (terima otomatis) pindah dari Pengaturan ke menu Stok.
- **Pengaturan jadi 8 kartu** (tampilan tetap seperti v1.1.4): Toko & Akses, Layanan & Harga (+ Diskon), Pembayaran & QRIS (+ Mutasi bank), Tampilan pelanggan (+ Popup poster promo), Karyawan, Jam operasional & FAQ, Template pesan WA (+ WA otomatis), Printer Bluetooth.
- Dihapus: kartu Keamanan (dobel dengan tombol Keluar), tombol "Buka Pusat Data" di Karyawan, dan tulisan "Ukuran data halaman" (hanya muncul jika data hampir penuh). Info "Masuk sebagai ..." pindah ke kartu Simpan.
- Beranda: Rekap pindah ke tombol Lainnya, diganti Stok.
- Tidak ada perubahan SQL.

## v1.1.7 - Pengaturan kembali seperti v1.1.4
- **Pengaturan dikembalikan ke tampilan v1.1.4** (kartu yang bisa dibuka-tutup, semua bagian di satu halaman). Menu Kelola dan tampilan kotak ikon Pengaturan dari v1.1.5 dan v1.1.6 dilepas.
- Stok & Produk kembali di Pengaturan -> Produk.
- Beranda admin tetap rapi 2 baris: Order Baru, Order, Jual, Pelanggan, Hutang, Laporan, Rekap, **Lainnya** (membuka Data dan Pengaturan).
- Tetap ada dari v1.1.5: kartu ulasan di halaman lacak dan template pesan WA yang profesional.
- Tidak ada perubahan SQL.

## v1.1.6 - Beranda dan Pengaturan dirapikan
- **Beranda admin**: menu jadi 8 kotak rapi (2 baris x 4) dengan ikon berwarna dan latar pastel yang lebih besar: Order Baru, Order, Jual, Pelanggan, Hutang, Laporan, Kelola, dan **Lainnya**. Tombol Lainnya membuka Rekap, Data, dan Pengaturan, lalu berubah jadi Tutup.
- **Pengaturan dan Kelola**: ada kartu profil toko di atas (logo, nama laundry), lalu kotak ikon dengan gaya yang sama seperti beranda.
- Tombol grafik (Uang masuk/Nilai order, 7/30 hari, Garis/Batang) dirapikan agar tidak berantakan di layar HP.
- Tidak ada perubahan SQL.

## v1.1.5 - Pengaturan ringkas, menu Kelola, ulasan umum, pesan WA profesional
- **Pengaturan hanya hal penting**, tampil sebagai kotak ikon (gaya aplikasi super): Toko, Layanan, Pembayaran, Karyawan, Tampilan, Pesan WA, WA Otomatis.
- **Menu Kelola baru** (ikon di beranda admin, dan tombol di Pengaturan): Stok & Produk, Diskon, Mutasi Bank, Poster Promo, Jam & FAQ. Tombol "Kelola stok" di kartu stok menipis langsung membuka Stok & Produk.
- **Ulasan di halaman lacak** (muncul saat cucian sudah diambil): bintang interaktif berwarna emas, label penilaian, komentar, tombol **Kirim ulasan** yang masuk langsung ke daftar testimoni (tampil setelah disetujui admin di Data -> Testimoni). Google Maps dan WhatsApp CS menjadi tautan kecil. Nama pelanggan disingkat (mis. "Budi S."). Butuh `sql/03_migrasi_v3.sql`.
- **Template pesan WA** ditulis ulang dengan bahasa bisnis yang sopan (Yth., rincian nota, Hormat kami). Template lama yang belum pernah Anda ubah otomatis diganti; yang sudah Anda ubah tidak disentuh. Tombol **Pulihkan template standar** ada di Pengaturan -> Pesan WA. Pesan tes WA otomatis juga disesuaikan.
- Tidak ada perubahan SQL.

## v1.1.4 - Kode lacak benar walau data di server belum diperbarui
- Di v1.1.3, link `#lacak=KODE8KARAKTER` masih menampilkan kode lama 6 karakter bila data lacak di Supabase belum diperbarui (harus ada satu kali Simpan oleh staf). Sekarang, saat pelanggan melacak dengan kode (lewat link, kolom Lacak, atau pemulihan lacakan terakhir), aplikasi memakai kode yang dipakai mencari sebagai kode order, karena server mencocokkannya persis. Hasilnya benar tanpa menunggu Simpan.
- Lacak lewat **nomor nota + 4 digit WA** masih menampilkan kode lama sampai staf melakukan satu kali Simpan (server belum punya kode barunya).
- Tidak ada perubahan SQL.

## v1.1.3 - Perbaikan link lacak kode 8 karakter
- **Link `#lacak=KODE8KARAKTER` menampilkan kode yang salah.** Data order yang dikirim ke pelanggan tidak memuat kode acak baru (`lk`), sehingga halaman pelanggan menghitung ulang kode lama 6 karakter dan menampilkannya. Sekarang `lk` ikut dikirim (`SB_KEEP`).
- **Mengetik kode 8 karakter di kolom Lacak selalu "tidak ditemukan".** Pemeriksaan di browser hanya menerima 6 karakter. Sekarang menerima 4-8 karakter, sama dengan aturan di server. `#KODE` polos juga menerima 6-8 karakter.
- Kode lama 6 karakter tetap berlaku.
- **Setelah deploy, lakukan satu kali Simpan** (mis. buka Atur lalu Simpan, atau ubah status satu order) agar data lacak di server diperbarui. Selama itu belum dilakukan, link lacak masih menampilkan kode lama.
- Tidak ada perubahan SQL.

## Perbaikan lanjutan v1.1.2 - "Akun ini bukan staf" saat Kirim pesan tes
**Wajib:** jalankan `sql/07_migrasi_v7.sql`, lalu deploy ulang fungsi `kirim-wa` (isi `supabase/functions/kirim-wa/index.ts`).
- **Penyebab:** `kirim-wa` membaca tabel `kl_staf` langsung memakai `service_role`. Pada project Supabase yang tabelnya tidak otomatis diberi hak akses Data API (perubahan default Supabase 30 Mei / 30 Okt 2026), pembacaan itu ditolak, dan karena errornya tidak diperiksa, owner pun dianggap "bukan staf".
- **Perbaikan:** peran dibaca lewat fungsi SQL `kl_peran_staf` (security definer, hanya bisa dipanggil `service_role`). Tabel tetap terkunci total. Bila pemeriksaan gagal, pesan sekarang menyebut penyebab aslinya, bukan "bukan staf".
- Aplikasi web (`app.js`) tidak berubah.

Pakai versi terbaru (**v1.1.2**). Isinya sudah mencakup semua perubahan di bawah.

## v1.1.2 - Perbaikan hasil evaluasi (keamanan + data)
**Wajib:** jalankan `sql/06_migrasi_v6.sql` (setelah 01-05) dan pasang ulang fungsi `kirim-wa` (isi `supabase/functions/kirim-wa/index.ts`).
- **Pesanan online tidak lagi "diterima" kalau gagal tersimpan.** Sebelumnya, bila simpan gagal (sinyal putus / konflik versi), pesanan tetap ditandai diterima di server dan pelanggan mendapat kode lacak yang tidak ada di data. Sekarang pesanan baru ditandai diterima setelah data benar-benar tersimpan. Bila gagal, order dibatalkan di memori, stok dikembalikan, dan pesanan kembali ke antrean. Bila balasan server hilang setelah tersimpan, pesanan tidak dobel.
- **Kode lacak order baru sekarang acak (8 karakter)**, bukan dihitung dari id dan waktu. Order lama tetap memakai kode lama, jadi kode/QR yang sudah dibagikan tetap berlaku. Kolom input kode tracking menerima 8 karakter.
- **Status pesanan online** (`kl_pesan_status`) kini dibatasi percobaannya per IP; kode pesanan baru 8 karakter acak (kode lama 5 karakter tetap bisa dicek). Batas kirim pesanan: 8/jam per IP, 60/jam total (sebelumnya 30/jam total).
- **Batas 3 testimoni/jam per IP.** Pesanan yang sudah ditolak tidak bisa diterima lagi.
- **`kirim-wa` dikunci:** pesan biasa hanya bila WA otomatis aktif, nomor tujuan ada di data order, dan maksimal 120 pesan/jam per akun. Pesan tes hanya untuk owner. Opsional: secret `ALLOWED_ORIGIN` (lihat `PANDUAN-FONNTE.md`).
- **Status "WA sudah dikirim" kini disimpan di order** (bukan di perangkat). Kartu "Perlu dikirim" sama di semua perangkat dan pesan tidak terkirim dobel bila ganti perangkat. Tanda lama di perangkat tetap dihormati.
- Cache: `index.html` memuat `app.js?v=1.1.2` dst; `config.js` kini `no-store` di `vercel.json`. Kotak error merah tidak lagi muncul untuk error jaringan.
- Jalankan ulang tes cepat: login, buat order, terima pesanan online, matikan internet lalu terima lagi (harus kembali ke antrean).

**Belum dikerjakan (saran berikutnya):** foto produk ke Supabase Storage, SRI untuk skrip CDN (`tambah-sri.sh`), kunci harga produk untuk kasir, mengganti pustaka xlsx, bersihkan kode mati, `script-src-attr 'unsafe-inline'` (butuh penulisan ulang `onclick`).

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
Urutan: `sql/01_keamanan.sql` -> `02_migrasi_v2.sql` -> `03_migrasi_v3.sql` -> `04_migrasi_v4.sql` -> `05_migrasi_v5.sql` -> `06_migrasi_v6.sql`.
Yang sudah pernah dijalankan tidak perlu dihapus. Untuk v9, jalankan ulang v3 yang baru.

## Setelah deploy
- Isi `config.js` dengan URL dan key Supabase yang dipakai sekarang (file ini bawaan zip masih kosong).
- Muat ulang paksa di browser agar cache lama tidak terpakai.
