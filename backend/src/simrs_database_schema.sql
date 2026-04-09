-- ============================================
-- SIMRS (Sistem Informasi Manajemen Rumah Sakit)
-- Database Schema PostgreSQL
-- ============================================

-- Extension untuk UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABEL MASTER DATA
-- ============================================

-- Tabel Users (Pengguna Sistem)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'dokter', 'perawat', 'farmasi', 'laboratorium', 'radiologi', 'kasir', 'registrasi')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Dokter
CREATE TABLE dokter (
    dokter_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    nama_lengkap VARCHAR(100) NOT NULL,
    spesialisasi VARCHAR(100),
    no_sip VARCHAR(50) UNIQUE NOT NULL,
    no_str VARCHAR(50) UNIQUE NOT NULL,
    alamat TEXT,
    telepon VARCHAR(20),
    email VARCHAR(100),
    jadwal_praktek JSONB, -- Format: [{"hari": "Senin", "jam_mulai": "08:00", "jam_selesai": "12:00"}]
    tarif_konsultasi DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Pasien
CREATE TABLE pasien (
    pasien_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no_rm VARCHAR(20) UNIQUE NOT NULL, -- Nomor Rekam Medis
    nik VARCHAR(16) UNIQUE,
    nama_lengkap VARCHAR(100) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    jenis_kelamin VARCHAR(10) CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
    golongan_darah VARCHAR(5) CHECK (golongan_darah IN ('A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    alamat TEXT,
    kelurahan VARCHAR(100),
    kecamatan VARCHAR(100),
    kota VARCHAR(100),
    provinsi VARCHAR(100),
    kode_pos VARCHAR(10),
    telepon VARCHAR(20),
    email VARCHAR(100),
    kontak_darurat VARCHAR(100),
    telepon_darurat VARCHAR(20),
    pekerjaan VARCHAR(100),
    status_pernikahan VARCHAR(20) CHECK (status_pernikahan IN ('Belum Menikah', 'Menikah', 'Cerai', 'Janda/Duda')),
    agama VARCHAR(20),
    jenis_pembayaran VARCHAR(50) DEFAULT 'Umum' CHECK (jenis_pembayaran IN ('Umum', 'BPJS', 'Asuransi', 'Corporate')),
    no_bpjs VARCHAR(50),
    asuransi_nama VARCHAR(100),
    asuransi_no_polis VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Poli/Klinik
CREATE TABLE poli (
    poli_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_poli VARCHAR(20) UNIQUE NOT NULL,
    nama_poli VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    lokasi VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Ruangan
CREATE TABLE ruangan (
    ruangan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_ruangan VARCHAR(20) UNIQUE NOT NULL,
    nama_ruangan VARCHAR(100) NOT NULL,
    jenis_ruangan VARCHAR(50) CHECK (jenis_ruangan IN ('VIP', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'ICU', 'ICCU', 'NICU', 'Isolasi')),
    kapasitas INTEGER NOT NULL,
    terisi INTEGER DEFAULT 0,
    tarif_per_hari DECIMAL(12,2) DEFAULT 0,
    fasilitas TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABEL PENDAFTARAN & REGISTRASI
-- ============================================

-- Tabel Pendaftaran Rawat Jalan
CREATE TABLE pendaftaran_rawat_jalan (
    pendaftaran_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no_pendaftaran VARCHAR(30) UNIQUE NOT NULL,
    pasien_id UUID REFERENCES pasien(pasien_id) ON DELETE CASCADE,
    dokter_id UUID REFERENCES dokter(dokter_id),
    poli_id UUID REFERENCES poli(poli_id),
    tanggal_pendaftaran TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tanggal_kunjungan DATE NOT NULL,
    jam_kunjungan TIME,
    jenis_kunjungan VARCHAR(20) CHECK (jenis_kunjungan IN ('Baru', 'Lama')),
    jenis_pembayaran VARCHAR(50) CHECK (jenis_pembayaran IN ('Umum', 'BPJS', 'Asuransi', 'Corporate')),
    keluhan_utama TEXT,
    status_pendaftaran VARCHAR(20) DEFAULT 'Terdaftar' CHECK (status_pendaftaran IN ('Terdaftar', 'Sedang Dilayani', 'Selesai', 'Batal')),
    nomor_antrian INTEGER,
    biaya_pendaftaran DECIMAL(12,2) DEFAULT 0,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Pendaftaran Rawat Inap
CREATE TABLE pendaftaran_rawat_inap (
    rawat_inap_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no_rawat_inap VARCHAR(30) UNIQUE NOT NULL,
    pasien_id UUID REFERENCES pasien(pasien_id) ON DELETE CASCADE,
    dokter_id UUID REFERENCES dokter(dokter_id),
    ruangan_id UUID REFERENCES ruangan(ruangan_id),
    tanggal_masuk TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tanggal_keluar TIMESTAMP,
    diagnosa_awal TEXT,
    jenis_pembayaran VARCHAR(50) CHECK (jenis_pembayaran IN ('Umum', 'BPJS', 'Asuransi', 'Corporate')),
    status_rawat_inap VARCHAR(20) DEFAULT 'Aktif' CHECK (status_rawat_inap IN ('Aktif', 'Selesai', 'Pindah Ruangan', 'Pulang Paksa', 'Meninggal')),
    keterangan TEXT,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABEL REKAM MEDIS ELEKTRONIK (RME)
-- ============================================

-- Tabel Rekam Medis
CREATE TABLE rekam_medis (
    rekam_medis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pasien_id UUID REFERENCES pasien(pasien_id) ON DELETE CASCADE,
    pendaftaran_id UUID REFERENCES pendaftaran_rawat_jalan(pendaftaran_id),
    rawat_inap_id UUID REFERENCES pendaftaran_rawat_inap(rawat_inap_id),
    dokter_id UUID REFERENCES dokter(dokter_id),
    tanggal_pemeriksaan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Anamnesa
    keluhan_utama TEXT,
    riwayat_penyakit_sekarang TEXT,
    riwayat_penyakit_dahulu TEXT,
    riwayat_penyakit_keluarga TEXT,
    riwayat_alergi TEXT,
    
    -- Pemeriksaan Fisik
    tekanan_darah VARCHAR(20),
    nadi INTEGER,
    suhu DECIMAL(4,2),
    pernapasan INTEGER,
    tinggi_badan DECIMAL(5,2),
    berat_badan DECIMAL(5,2),
    pemeriksaan_fisik_lainnya TEXT,
    
    -- Diagnosa
    diagnosa_primer VARCHAR(10), -- Kode ICD-10
    diagnosa_primer_text TEXT,
    diagnosa_sekunder VARCHAR(10), -- Kode ICD-10
    diagnosa_sekunder_text TEXT,
    
    -- Tindakan & Terapi
    tindakan_medis TEXT,
    rencana_pengobatan TEXT,
    catatan_dokter TEXT,
    
    -- Status
    status_pemeriksaan VARCHAR(20) DEFAULT 'Draft' CHECK (status_pemeriksaan IN ('Draft', 'Selesai', 'Rujuk')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABEL LABORATORIUM
-- ============================================

-- Tabel Jenis Pemeriksaan Lab
CREATE TABLE jenis_pemeriksaan_lab (
    jenis_lab_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_pemeriksaan VARCHAR(20) UNIQUE NOT NULL,
    nama_pemeriksaan VARCHAR(200) NOT NULL,
    kategori VARCHAR(100), -- Hematologi, Kimia Klinik, Mikrobiologi, dll
    satuan VARCHAR(50),
    nilai_normal_min DECIMAL(10,2),
    nilai_normal_max DECIMAL(10,2),
    nilai_normal_text TEXT,
    tarif DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Permintaan Lab
CREATE TABLE permintaan_lab (
    permintaan_lab_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no_permintaan VARCHAR(30) UNIQUE NOT NULL,
    rekam_medis_id UUID REFERENCES rekam_medis(rekam_medis_id),
    pasien_id UUID REFERENCES pasien(pasien_id),
    dokter_id UUID REFERENCES dokter(dokter_id),
    tanggal_permintaan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    diagnosa_klinis TEXT,
    catatan_permintaan TEXT,
    status_permintaan VARCHAR(20) DEFAULT 'Pending' CHECK (status_permintaan IN ('Pending', 'Diproses', 'Selesai', 'Batal')),
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Detail Permintaan Lab
CREATE TABLE detail_permintaan_lab (
    detail_lab_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permintaan_lab_id UUID REFERENCES permintaan_lab(permintaan_lab_id) ON DELETE CASCADE,
    jenis_lab_id UUID REFERENCES jenis_pemeriksaan_lab(jenis_lab_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Hasil Lab
CREATE TABLE hasil_lab (
    hasil_lab_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    detail_lab_id UUID REFERENCES detail_permintaan_lab(detail_lab_id),
    hasil_pemeriksaan TEXT,
    nilai_numerik DECIMAL(10,2),
    satuan VARCHAR(50),
    nilai_rujukan TEXT,
    flag VARCHAR(10) CHECK (flag IN ('Normal', 'Tinggi', 'Rendah', 'Abnormal')),
    tanggal_hasil TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    petugas_lab UUID REFERENCES users(user_id),
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABEL RADIOLOGI
-- ============================================

-- Tabel Jenis Pemeriksaan Radiologi
CREATE TABLE jenis_pemeriksaan_radiologi (
    jenis_radiologi_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_pemeriksaan VARCHAR(20) UNIQUE NOT NULL,
    nama_pemeriksaan VARCHAR(200) NOT NULL,
    kategori VARCHAR(100), -- Rontgen, CT Scan, MRI, USG, dll
    deskripsi TEXT,
    tarif DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Permintaan Radiologi
CREATE TABLE permintaan_radiologi (
    permintaan_radiologi_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no_permintaan VARCHAR(30) UNIQUE NOT NULL,
    rekam_medis_id UUID REFERENCES rekam_medis(rekam_medis_id),
    pasien_id UUID REFERENCES pasien(pasien_id),
    dokter_id UUID REFERENCES dokter(dokter_id),
    jenis_radiologi_id UUID REFERENCES jenis_pemeriksaan_radiologi(jenis_radiologi_id),
    tanggal_permintaan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    diagnosa_klinis TEXT,
    catatan_permintaan TEXT,
    status_permintaan VARCHAR(20) DEFAULT 'Pending' CHECK (status_permintaan IN ('Pending', 'Diproses', 'Selesai', 'Batal')),
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Hasil Radiologi
CREATE TABLE hasil_radiologi (
    hasil_radiologi_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permintaan_radiologi_id UUID REFERENCES permintaan_radiologi(permintaan_radiologi_id),
    tanggal_pemeriksaan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hasil_pemeriksaan TEXT,
    kesan TEXT,
    saran TEXT,
    radiolog UUID REFERENCES users(user_id),
    file_gambar TEXT[], -- Array path file gambar
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABEL FARMASI
-- ============================================

-- Tabel Master Obat
CREATE TABLE obat (
    obat_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_obat VARCHAR(20) UNIQUE NOT NULL,
    nama_obat VARCHAR(200) NOT NULL,
    nama_generik VARCHAR(200),
    kategori VARCHAR(100), -- Tablet, Kapsul, Sirup, Injeksi, dll
    satuan VARCHAR(50),
    harga_beli DECIMAL(12,2) DEFAULT 0,
    harga_jual DECIMAL(12,2) DEFAULT 0,
    stok_minimum INTEGER DEFAULT 10,
    stok_tersedia INTEGER DEFAULT 0,
    pabrik VARCHAR(200),
    golongan VARCHAR(50), -- Obat Bebas, Obat Bebas Terbatas, Obat Keras, Narkotika, Psikotropika
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Resep
CREATE TABLE resep (
    resep_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no_resep VARCHAR(30) UNIQUE NOT NULL,
    rekam_medis_id UUID REFERENCES rekam_medis(rekam_medis_id),
    pasien_id UUID REFERENCES pasien(pasien_id),
    dokter_id UUID REFERENCES dokter(dokter_id),
    tanggal_resep TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_resep VARCHAR(20) DEFAULT 'Pending' CHECK (status_resep IN ('Pending', 'Diproses', 'Selesai', 'Batal')),
    total_harga DECIMAL(12,2) DEFAULT 0,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Detail Resep
CREATE TABLE detail_resep (
    detail_resep_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resep_id UUID REFERENCES resep(resep_id) ON DELETE CASCADE,
    obat_id UUID REFERENCES obat(obat_id),
    jumlah INTEGER NOT NULL,
    dosis VARCHAR(100), -- Contoh: "3x1 sehari"
    aturan_pakai TEXT,
    harga_satuan DECIMAL(12,2) DEFAULT 0,
    subtotal DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABEL KEUANGAN & BILLING
-- ============================================

-- Tabel Jenis Biaya
CREATE TABLE jenis_biaya (
    jenis_biaya_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_biaya VARCHAR(20) UNIQUE NOT NULL,
    nama_biaya VARCHAR(200) NOT NULL,
    kategori VARCHAR(100), -- Konsultasi, Tindakan, Laboratorium, Radiologi, Obat, Ruangan, dll
    tarif DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Tagihan
CREATE TABLE tagihan (
    tagihan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no_tagihan VARCHAR(30) UNIQUE NOT NULL,
    pasien_id UUID REFERENCES pasien(pasien_id),
    pendaftaran_id UUID REFERENCES pendaftaran_rawat_jalan(pendaftaran_id),
    rawat_inap_id UUID REFERENCES pendaftaran_rawat_inap(rawat_inap_id),
    tanggal_tagihan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_tagihan DECIMAL(12,2) DEFAULT 0,
    diskon DECIMAL(12,2) DEFAULT 0,
    total_bayar DECIMAL(12,2) DEFAULT 0,
    status_pembayaran VARCHAR(20) DEFAULT 'Belum Lunas' CHECK (status_pembayaran IN ('Belum Lunas', 'Lunas', 'Cicilan')),
    jenis_pembayaran VARCHAR(50),
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Detail Tagihan
CREATE TABLE detail_tagihan (
    detail_tagihan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tagihan_id UUID REFERENCES tagihan(tagihan_id) ON DELETE CASCADE,
    jenis_biaya_id UUID REFERENCES jenis_biaya(jenis_biaya_id),
    deskripsi TEXT,
    jumlah INTEGER DEFAULT 1,
    harga_satuan DECIMAL(12,2) DEFAULT 0,
    subtotal DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Pembayaran
CREATE TABLE pembayaran (
    pembayaran_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no_pembayaran VARCHAR(30) UNIQUE NOT NULL,
    tagihan_id UUID REFERENCES tagihan(tagihan_id),
    tanggal_pembayaran TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    jumlah_bayar DECIMAL(12,2) NOT NULL,
    metode_pembayaran VARCHAR(50) CHECK (metode_pembayaran IN ('Tunai', 'Transfer', 'Kartu Kredit', 'Kartu Debit', 'BPJS', 'Asuransi')),
    no_referensi VARCHAR(100),
    kasir UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES untuk Performa
-- ============================================

CREATE INDEX idx_pasien_no_rm ON pasien(no_rm);
CREATE INDEX idx_pasien_nik ON pasien(nik);
CREATE INDEX idx_pendaftaran_tanggal ON pendaftaran_rawat_jalan(tanggal_kunjungan);
CREATE INDEX idx_pendaftaran_pasien ON pendaftaran_rawat_jalan(pasien_id);
CREATE INDEX idx_rekam_medis_pasien ON rekam_medis(pasien_id);
CREATE INDEX idx_rekam_medis_tanggal ON rekam_medis(tanggal_pemeriksaan);
CREATE INDEX idx_permintaan_lab_tanggal ON permintaan_lab(tanggal_permintaan);
CREATE INDEX idx_permintaan_radiologi_tanggal ON permintaan_radiologi(tanggal_permintaan);
CREATE INDEX idx_resep_tanggal ON resep(tanggal_resep);
CREATE INDEX idx_tagihan_pasien ON tagihan(pasien_id);
CREATE INDEX idx_tagihan_tanggal ON tagihan(tanggal_tagihan);

-- ============================================
-- TRIGGER untuk Updated At
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dokter_updated_at BEFORE UPDATE ON dokter
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pasien_updated_at BEFORE UPDATE ON pasien
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pendaftaran_updated_at BEFORE UPDATE ON pendaftaran_rawat_jalan
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rawat_inap_updated_at BEFORE UPDATE ON pendaftaran_rawat_inap
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rekam_medis_updated_at BEFORE UPDATE ON rekam_medis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional)
-- ============================================

-- Insert sample admin user (password: admin123)
INSERT INTO users (username, password_hash, full_name, email, role) 
VALUES ('admin', '$2b$10$YourHashedPasswordHere', 'Administrator', 'admin@simrs.com', 'admin');

-- Insert sample poli
INSERT INTO poli (kode_poli, nama_poli, deskripsi, lokasi) VALUES
('UMUM', 'Poli Umum', 'Pelayanan kesehatan umum', 'Gedung A Lt.1'),
('ANAK', 'Poli Anak', 'Pelayanan kesehatan anak', 'Gedung A Lt.2'),
('KANDUNGAN', 'Poli Kandungan', 'Pelayanan kesehatan kandungan', 'Gedung B Lt.1'),
('GIGI', 'Poli Gigi', 'Pelayanan kesehatan gigi', 'Gedung A Lt.1'),
('MATA', 'Poli Mata', 'Pelayanan kesehatan mata', 'Gedung B Lt.2');

-- Insert sample ruangan
INSERT INTO ruangan (kode_ruangan, nama_ruangan, jenis_ruangan, kapasitas, tarif_per_hari) VALUES
('VIP-01', 'Ruang VIP 1', 'VIP', 1, 1500000),
('K1-01', 'Ruang Kelas 1-A', 'Kelas 1', 2, 800000),
('K2-01', 'Ruang Kelas 2-A', 'Kelas 2', 4, 500000),
('K3-01', 'Ruang Kelas 3-A', 'Kelas 3', 6, 300000),
('ICU-01', 'ICU Unit 1', 'ICU', 1, 2000000);

COMMENT ON DATABASE postgres IS 'SIMRS - Sistem Informasi Manajemen Rumah Sakit';
