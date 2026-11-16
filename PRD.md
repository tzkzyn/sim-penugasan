# Product Requirements Document (PRD)
## SIM-Penugasan (Sistem Informasi Manajemen Penugasan & Presensi Pegawai)

---

### 1. Latar Belakang & Masalah
Dalam instansi pemerintah daerah, proses koordinasi penugasan dinas luar pegawai sering kali menghadapi kendala efisiensi, akuntabilitas, dan keterpaduan data:
1. **Pengajuan Penugasan Masih Manual / Terpisah**: Draf tugas dan nota dinas masih disusun lewat dokumen terpisah, memperlambat proses persetujuan (*approval*).
2. **Ketiadaan Pemantauan Spasial Real-Time**: Sulit bagi pimpinan untuk memantau sebaran lokasi dan beban penugasan pegawai di lapangan secara geografis.
3. **Keterlambatan Penerbitan Naskah Resmi**: Pencetakan Surat Perintah Tugas (SPT) resmi sering memakan waktu karena format surat tidak otomatis terhubung ke sistem kepegawaian.
4. **Disiplin & Validasi Presensi**: Diperlukan pencatatan absensi yang terintegrasi langsung dengan status dinas luar, keterlambatan, serta izin/cuti pegawai.

---

### 2. Tujuan Produk (*Product Goals*)
1. Menyediakan platform terpadu untuk pengajuan, verifikasi, dan penerbitan Surat Perintah Tugas (SPT) secara digital.
2. Memfasilitasi alur persetujuan (*Approval Workflow*) bertingkat secara transparan dan *real-time*.
3. Menyajikan visualisasi pemetaan sebaran penugasan berbasis GIS (Leaflet) untuk pemerataan beban tugas pegawai.
4. Mengintegrasikan pencatatan presensi kehadiran dan pengajuan izin/cuti dalam satu ekosistem kepegawaian.
5. Mendukung pencetakan naskah dinas resmi SPT standar pemerintah secara instan di peramban web (*native browser print*).

---

### 3. Profil Pengguna & Peran (*User Personas & RBAC*)

| Peran (Role) | Tanggung Jawab Utama | Akses Halaman |
| :--- | :--- | :--- |
| **Super Admin** | Manajemen penuh master data, manajemen akun pengguna, reset password, POKJA, unit kerja, dan konfigurasi sistem. | `/super-admin/*` |
| **Admin Unit** | Pembuatan dan penjadwalan tugas dinas pegawai, monitoring progres tugas, dan verifikasi upload laporan pelaksanaan tugas. | `/admin/*` |
| **Approval (Pimpinan)** | Menelaah usulan tugas dari subbagian, menyetujui (*ACC*) atau menolak (*Reject*) ajuan tugas dinas, dan melihat riwayat keputusan. | `/approval/*` |
| **User (Pegawai)** | Mengajukan draf tugas baru, menyusun naskah usulan di web, memantau progres tugas dinas, presensi harian, dan pengajuan izin/cuti. | `/user/*` |

---

### 4. Lingkup Fitur Utama (*Scope of Features*)

#### A. Modul Penugasan & Approval
* **Pengajuan Draf Tugas**: Penginputan perihal, pemilihan pegawai pelaksana lintas-unit, rentang tanggal dinas, pemilihan domisili (Provinsi/Kabupaten/Kota), dan koordinat GPS.
* **Editor Naskah Dokumen Langsung di Web**: Penyusunan isi surat tugas atau nota usulan langsung di web browser dengan template instansi otomatis.
* **Alur Persetujuan 4 Tahap**:
  1. `DRAFT`: Tugas baru diajukan pegawai/admin.
  2. `VERIFIKASI_SUBBAGIAN`: Telaah kelengkapan administrasi oleh kepala subbagian.
  3. `PERSETUJUAN_PIMPINAN`: Keputusan persetujuan oleh Kepala Dinas / Pejabat Penyetuju.
  4. `SURAT_TERBIT`: Penomoran otomatis dan penerbitan SPT resmi.
* **Pencetakan SPT Standar Resmi**: Template naskah dinas berstandar Pemda DIY Diskominfo lengkap dengan Kop Surat resmi, dasar hukum, tabel pegawai, waktu/lokasi, barcode/QR verifikasi digital, dan tanda tangan pejabat.

#### B. Modul Presensi & Izin/Cuti
* **Presensi Harian**: Pencatatan status *Hadir*, *Terlambat*, *Izin*, *Sakit*, dan *Alfa* beserta estimasi tunjangan kinerja (tukin).
* **Indikator Perhatian Khusus**: Penanda visual merah menyala untuk status yang membutuhkan konfirmasi atasan (`TERLAMBAT`, `ALFA`, dan tugas `DITOLAK`).
* **Pengajuan Izin & Cuti**: Formulir pengajuan cuti tahunan, sakit, atau alasan penting lengkap dengan pelacak sisa kuota cuti.

#### C. Modul Geospasial & Monitoring
* **Pemetaan Interaktif Leaflet**: Pin lokasi dinas interaktif yang mencerminkan tugas berstatus aktif dan surat terbit.
* **Filter Multifaktor**: Filter sebaran berdasarkan unit kerja (RBI, Fastingkom, Kepeg, PM), status penugasan, dan rentang periode dinas.

---

### 5. Batasan Sistem (*System Constraints*)
1. Menjaga kode tetap bersih, modular, dan mematuhi batasan dependensi (tidak menambahkan pustaka eksternal sembarangan).
2. Kompatibilitas cetak format A4 portrait murni menggunakan `@media print` CSS tanpa pustaka konversi PDF berat di sisi klien.
3. Proteksi rute navigasi menggunakan `ProtectedRoute` agar hak akses antar-peran tidak bocor.

