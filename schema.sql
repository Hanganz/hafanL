-- Skema MySQL 8 / MariaDB 10.5+ untuk Kasir Laundry.
-- Catatan: semua waktu disimpan dalam UTC. Uang = rupiah bulat (BIGINT). Jumlah barang = DECIMAL(10,2).
-- Gambar TIDAK disimpan di database: simpan berkasnya di folder uploads/ dan hanya path-nya di sini.
SET NAMES utf8mb4;

CREATE TABLE pengguna (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama VARCHAR(80) NOT NULL,
  no_hp VARCHAR(20) NULL,
  peran ENUM('pemilik','karyawan') NOT NULL DEFAULT 'karyawan',
  jabatan VARCHAR(60) NULL,
  pin_hash VARCHAR(255) NULL,
  wajib_atur_pin TINYINT(1) NOT NULL DEFAULT 1,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  gagal_login INT UNSIGNED NOT NULL DEFAULT 0,
  terkunci_sampai DATETIME(3) NULL,
  dibuat_pada DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_pengguna_hp (no_hp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pelanggan (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  kode VARCHAR(12) NOT NULL,                       -- CUST0001, tidak dipakai ulang
  nama VARCHAR(100) NOT NULL,
  no_wa VARCHAR(20) NULL,                          -- NULL bila pelanggan "tanpa no WA"
  tanpa_wa TINYINT(1) NOT NULL DEFAULT 0,
  alamat TEXT NULL,
  catatan_internal VARCHAR(500) NULL,              -- hanya untuk kasir, tidak dicetak di nota
  bermasalah TINYINT(1) NOT NULL DEFAULT 0,
  dibuat_pada DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_pelanggan_kode (kode),
  UNIQUE KEY uq_pelanggan_wa (no_wa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE akun_pelanggan (
  pelanggan_id INT UNSIGNED NOT NULL,
  kata_sandi_hash VARCHAR(255) NULL,
  legacy_salt VARCHAR(64) NULL,
  legacy_hash VARCHAR(64) NULL,
  disetujui_oleh INT UNSIGNED NULL,
  dibuat_pada DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (pelanggan_id),
  CONSTRAINT fk_akun_pelanggan FOREIGN KEY (pelanggan_id) REFERENCES pelanggan (id),
  CONSTRAINT fk_akun_setuju FOREIGN KEY (disetujui_oleh) REFERENCES pengguna (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE layanan (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  kode VARCHAR(30) NOT NULL,
  nama VARCHAR(100) NOT NULL,
  harga BIGINT NOT NULL DEFAULT 0,
  satuan VARCHAR(20) NOT NULL DEFAULT 'kg',
  durasi_jam INT UNSIGNED NOT NULL DEFAULT 24,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  urutan INT NOT NULL DEFAULT 0,
  produk TINYINT(1) NOT NULL DEFAULT 0,           -- 1 = barang dijual (plastik, parfum, hanger), bukan layanan cuci
  stok INT NULL,                                  -- NULL = stok tidak dihitung
  PRIMARY KEY (id),
  UNIQUE KEY uq_layanan_kode (kode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE diskon (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama VARCHAR(60) NOT NULL,
  jenis ENUM('persen','rupiah') NOT NULL,
  nilai INT UNSIGNED NOT NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pesanan (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  no_nota VARCHAR(24) NOT NULL,
  kode_lacak VARCHAR(16) NOT NULL,
  pelanggan_id INT UNSIGNED NOT NULL,
  status ENUM('diterima','diproses','selesai','diambil','dibatalkan') NOT NULL DEFAULT 'diterima',
  diskon BIGINT NOT NULL DEFAULT 0,
  diskon_keterangan VARCHAR(200) NULL,
  penjualan TINYINT(1) NOT NULL DEFAULT 0,        -- 1 = penjualan produk langsung (tanpa proses cuci)
  voucher_nilai BIGINT NOT NULL DEFAULT 0,
  total BIGINT NOT NULL,
  estimasi_selesai DATETIME(3) NULL,
  selesai_pada DATETIME(3) NULL,
  diambil_pada DATETIME(3) NULL,
  catatan VARCHAR(500) NULL,
  jumlah_baju INT UNSIGNED NULL,
  jemput TINYINT(1) NOT NULL DEFAULT 0,
  antar TINYINT(1) NOT NULL DEFAULT 0,
  alamat VARCHAR(500) NULL,
  jadwal_jemput DATETIME(3) NULL,
  jadwal_antar DATETIME(3) NULL,
  penanggung_jawab_id INT UNSIGNED NULL,
  dibuat_oleh INT UNSIGNED NULL,
  dibuat_pada DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  dibatalkan_pada DATETIME(3) NULL,
  dibatalkan_oleh INT UNSIGNED NULL,
  alasan_batal VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pesanan_nota (no_nota),
  UNIQUE KEY uq_pesanan_lacak (kode_lacak),
  KEY idx_pesanan_pelanggan (pelanggan_id),
  KEY idx_pesanan_status (status, dibuat_pada),
  CONSTRAINT fk_pesanan_pelanggan FOREIGN KEY (pelanggan_id) REFERENCES pelanggan (id),
  CONSTRAINT fk_pesanan_pj FOREIGN KEY (penanggung_jawab_id) REFERENCES pengguna (id),
  CONSTRAINT fk_pesanan_buat FOREIGN KEY (dibuat_oleh) REFERENCES pengguna (id),
  CONSTRAINT fk_pesanan_batal FOREIGN KEY (dibatalkan_oleh) REFERENCES pengguna (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pesanan_item (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pesanan_id INT UNSIGNED NOT NULL,
  layanan_id INT UNSIGNED NOT NULL,
  nama_layanan VARCHAR(100) NOT NULL,
  satuan VARCHAR(20) NOT NULL,
  jumlah DECIMAL(10,2) NOT NULL,
  harga_satuan BIGINT NOT NULL,
  subtotal BIGINT NOT NULL,
  catatan VARCHAR(200) NULL,
  jumlah_pakaian INT UNSIGNED NULL,
  siap_pada DATETIME(3) NULL,                      -- status siap per item (karpet bisa lebih lama dari baju)
  PRIMARY KEY (id),
  KEY idx_item_pesanan (pesanan_id),
  CONSTRAINT fk_item_pesanan FOREIGN KEY (pesanan_id) REFERENCES pesanan (id),
  CONSTRAINT fk_item_layanan FOREIGN KEY (layanan_id) REFERENCES layanan (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- jumlah positif = pembayaran masuk, negatif = pengembalian
CREATE TABLE pembayaran (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pesanan_id INT UNSIGNED NOT NULL,
  metode ENUM('tunai','transfer','qris','saldo') NOT NULL,
  jumlah BIGINT NOT NULL,
  referensi VARCHAR(20) NULL,
  catatan VARCHAR(255) NULL,
  dibayar_pada DATETIME(3) NOT NULL,
  dicatat_oleh INT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_bayar_pesanan (pesanan_id),
  KEY idx_bayar_waktu (dibayar_pada, metode),
  CONSTRAINT fk_bayar_pesanan FOREIGN KEY (pesanan_id) REFERENCES pesanan (id),
  CONSTRAINT fk_bayar_oleh FOREIGN KEY (dicatat_oleh) REFERENCES pengguna (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- mutasi bank masuk (dari webhook layanan mutasi atau impor manual). id_eksternal membuat penerimaan webhook idempoten.
CREATE TABLE mutasi_bank (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sumber VARCHAR(40) NOT NULL,
  id_eksternal VARCHAR(100) NULL,
  waktu DATETIME(3) NOT NULL,
  jumlah BIGINT NOT NULL,
  keterangan VARCHAR(255) NULL,
  pesanan_id INT UNSIGNED NULL,
  pembayaran_id INT UNSIGNED NULL,
  status ENUM('baru','dicocokkan','diabaikan') NOT NULL DEFAULT 'baru',
  dibuat_pada DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_mutasi_eks (sumber, id_eksternal),
  KEY idx_mutasi_status (status, waktu),
  CONSTRAINT fk_mutasi_pesanan FOREIGN KEY (pesanan_id) REFERENCES pesanan (id),
  CONSTRAINT fk_mutasi_bayar FOREIGN KEY (pembayaran_id) REFERENCES pembayaran (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- buku besar saldo deposit: saldo = SUM(jumlah). isi (+), pakai (-), kembali (+), penyesuaian (+/-)
CREATE TABLE saldo_mutasi (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pelanggan_id INT UNSIGNED NOT NULL,
  jenis ENUM('isi','pakai','kembali','penyesuaian') NOT NULL,
  jumlah BIGINT NOT NULL,
  metode ENUM('tunai','transfer','qris') NULL,
  referensi VARCHAR(20) NULL,
  pesanan_id INT UNSIGNED NULL,
  dibuat_pada DATETIME(3) NOT NULL,
  dibuat_oleh INT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_saldo_pelanggan (pelanggan_id),
  CONSTRAINT fk_saldo_pelanggan FOREIGN KEY (pelanggan_id) REFERENCES pelanggan (id),
  CONSTRAINT fk_saldo_pesanan FOREIGN KEY (pesanan_id) REFERENCES pesanan (id),
  CONSTRAINT fk_saldo_oleh FOREIGN KEY (dibuat_oleh) REFERENCES pengguna (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE voucher (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pelanggan_id INT UNSIGNED NOT NULL,
  nilai BIGINT NOT NULL,
  sumber VARCHAR(30) NOT NULL DEFAULT 'tebus_poin',
  dibuat_pada DATETIME(3) NOT NULL,
  dipakai_pada DATETIME(3) NULL,
  pesanan_id INT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_voucher_pelanggan (pelanggan_id, dipakai_pada),
  CONSTRAINT fk_voucher_pelanggan FOREIGN KEY (pelanggan_id) REFERENCES pelanggan (id),
  CONSTRAINT fk_voucher_pesanan FOREIGN KEY (pesanan_id) REFERENCES pesanan (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE poin_mutasi (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pelanggan_id INT UNSIGNED NOT NULL,
  jenis ENUM('dapat','tebus') NOT NULL,
  poin INT NOT NULL,
  pesanan_id INT UNSIGNED NULL,
  dibuat_pada DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_poin_pelanggan (pelanggan_id),
  CONSTRAINT fk_poin_pelanggan FOREIGN KEY (pelanggan_id) REFERENCES pelanggan (id),
  CONSTRAINT fk_poin_pesanan FOREIGN KEY (pesanan_id) REFERENCES pesanan (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE status_pesanan_log (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pesanan_id INT UNSIGNED NOT NULL,
  status ENUM('diterima','diproses','selesai','diambil','dibatalkan') NOT NULL,
  waktu DATETIME(3) NOT NULL,
  oleh INT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_log_pesanan (pesanan_id),
  CONSTRAINT fk_log_pesanan FOREIGN KEY (pesanan_id) REFERENCES pesanan (id),
  CONSTRAINT fk_log_oleh FOREIGN KEY (oleh) REFERENCES pengguna (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE testimoni (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama VARCHAR(80) NOT NULL,
  bintang TINYINT UNSIGNED NOT NULL,
  isi VARCHAR(500) NOT NULL,
  tampil TINYINT(1) NOT NULL DEFAULT 1,          -- 1 = langsung tampil; pemilik bisa menyembunyikan (0)
  pesanan_id INT UNSIGNED NULL,                  -- satu ulasan per pesanan; hanya dari pesanan yang sudah selesai
  ip_hash CHAR(64) NULL,                         -- sidik jari IP (di-hash) untuk batas per hari, bukan IP asli
  dibuat_pada DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_testimoni_pesanan (pesanan_id),
  KEY idx_testimoni_ip (ip_hash, dibuat_pada),
  CONSTRAINT fk_testimoni_pesanan FOREIGN KEY (pesanan_id) REFERENCES pesanan (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tutup_kas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tanggal DATE NOT NULL,
  modal_awal BIGINT NOT NULL DEFAULT 0,
  menurut_sistem BIGINT NOT NULL,
  uang_laci BIGINT NOT NULL,
  selisih BIGINT NOT NULL,
  dibuat_oleh INT UNSIGNED NULL,
  dibuat_pada DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_kas_oleh FOREIGN KEY (dibuat_oleh) REFERENCES pengguna (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE jejak_aktivitas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  waktu DATETIME(3) NOT NULL,
  pengguna_id INT UNSIGNED NULL,
  aksi VARCHAR(60) NOT NULL,
  nota VARCHAR(24) NULL,
  keterangan VARCHAR(255) NULL,
  PRIMARY KEY (id),
  KEY idx_jejak_waktu (waktu),
  CONSTRAINT fk_jejak_pengguna FOREIGN KEY (pengguna_id) REFERENCES pengguna (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE banner_promo (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  path_gambar VARCHAR(200) NOT NULL,
  judul VARCHAR(100) NULL,
  urutan INT NOT NULL DEFAULT 0,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- pengaturan toko; rahasia=1 tidak pernah dikirim ke halaman publik (mis. teks QRIS)
CREATE TABLE pengaturan (
  kunci VARCHAR(60) NOT NULL,
  nilai MEDIUMTEXT NULL,
  rahasia TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (kunci)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- penghitung nomor nota harian yang hanya naik
CREATE TABLE nomor_nota_urut (
  tanggal DATE NOT NULL,
  terakhir INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (tanggal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE VIEW v_tagihan AS
SELECT p.id AS pesanan_id, p.total AS total, COALESCE(SUM(b.jumlah),0) AS terbayar,
       CASE WHEN p.status = 'dibatalkan' THEN 0 ELSE p.total - COALESCE(SUM(b.jumlah),0) END AS sisa
FROM pesanan p LEFT JOIN pembayaran b ON b.pesanan_id = p.id
GROUP BY p.id, p.total, p.status;

CREATE VIEW v_saldo AS
SELECT pelanggan_id, SUM(jumlah) AS saldo FROM saldo_mutasi GROUP BY pelanggan_id;

CREATE VIEW v_poin AS
SELECT pelanggan_id, SUM(CASE WHEN jenis = 'dapat' THEN poin ELSE -poin END) AS poin
FROM poin_mutasi GROUP BY pelanggan_id;
